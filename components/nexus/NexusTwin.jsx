'use client';
// Data-driven digital twin of a Nexus facility. Every rack (instanced, one
// draw call) and every component is placed from data/nexus coordinates. The
// component draws whatever `view` (lib/nexus/twin-model.js) describes:
// per-object state, ripple timing, flow lines, labels and camera focus.
import { useEffect, useRef, useState } from 'react';
import { racksOf, componentsOf, getComponent, getRack } from '@/lib/nexus/data';
import { orientationLabels } from '@/lib/nexus/twin-model';
import { STATE_STYLE, COMPONENT_BASE, LABEL_TONE, BACKGROUND } from './palette';

const MS_PER_HOP = 120;
const LABEL_PX = 21;
const FOV = 40;
const HOME_DIRECTION = [0.3, 0.7, 0.86];

// Footprint (w, h, d in metres) per component type. Busways hang at their
// dataset height; everything else stands on the floor.
const SHAPES = {
  pdu: { kind: 'box', size: [0.5, 1.6, 0.9] },
  crah: { kind: 'box', size: [0.9, 1.9, 1.1] },
  busway: { kind: 'box', size: [12, 0.25, 0.35], hanging: true },
  rpp: { kind: 'box', size: [0.9, 1.8, 0.7] },
  ups: { kind: 'box', size: [1.4, 2.0, 1.0] },
  switchgear: { kind: 'box', size: [1.3, 2.2, 3.2] },
  transformer: { kind: 'box', size: [2.4, 2.4, 2.4] },
  utility_feed: { kind: 'cyl', size: [0.5, 4.5, 0.5] },
  generator: { kind: 'box', size: [4, 2.4, 1.8] },
  chiller: { kind: 'box', size: [5, 2.6, 2.4] },
  cooling_tower: { kind: 'cyl', size: [2.0, 4.2, 2.0] },
  chw_loop: { kind: 'box', size: [6, 0.5, 0.5] },
};
const RACK_SIZE = [0.56, 2.0, 1.15];

export default function NexusTwin({ facilityId, view, runKey = 0, insetLeft = 0, insetRight = 0, onRackClick, onComponentClick }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const propsRef = useRef({});
  const [hover, setHover] = useState(null);
  propsRef.current = { insetLeft, insetRight, onRackClick, onComponentClick };

  // ─── Build the scene once per facility ───────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;
    let disposed = false;
    let cleanup = () => {};

    Promise.all([import('three'), import('three/examples/jsm/controls/OrbitControls.js')]).then(([THREE, { OrbitControls }]) => {
      if (disposed) return;
      const racks = racksOf(facilityId);
      const comps = componentsOf(facilityId).filter((c) => c.component_type !== 'rack_row' && SHAPES[c.component_type]);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const bg = new THREE.Color(BACKGROUND);
      scene.background = bg;
      const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 600);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.12;
      controls.maxPolarAngle = Math.PI * 0.47;
      controls.minDistance = 6;
      controls.maxDistance = 220;

      scene.add(new THREE.AmbientLight(0xffffff, 1.1));
      const sun = new THREE.DirectionalLight(0xffffff, 1.4);
      sun.position.set(30, 60, 40);
      scene.add(sun);

      // ── Floor: facility slab, hall slabs and the two equipment zones ──
      const allPoints = [...racks.map((r) => [r.x_m, r.z_m]), ...comps.map((c) => [c.position.x, c.position.z])];
      const minX = Math.min(...allPoints.map((p) => p[0])) - 4, maxX = Math.max(...allPoints.map((p) => p[0])) + 4;
      const minZ = Math.min(...allPoints.map((p) => p[1])) - 4, maxZ = Math.max(...allPoints.map((p) => p[1])) + 4;
      const slab = (x0, x1, z0, z1, color, y) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
        m.rotation.x = -Math.PI / 2;
        m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
        scene.add(m);
      };
      slab(minX, maxX, minZ, maxZ, 0x0b1424, 0);
      const extent = (items, getX, getZ, pad) => [Math.min(...items.map(getX)) - pad, Math.max(...items.map(getX)) + pad, Math.min(...items.map(getZ)) - pad, Math.max(...items.map(getZ)) + pad];
      for (const hallId of [...new Set(racks.map((r) => r.hall_id))]) {
        const [x0, x1, z0, z1] = extent(racks.filter((r) => r.hall_id === hallId), (r) => r.x_m, (r) => r.z_m, 1.6);
        slab(x0, x1, z0, z1, 0x13203a, 0.01);
      }
      for (const zone of ['plant room', 'outdoor yard']) {
        const zc = comps.filter((c) => c.zone === zone);
        if (zc.length) {
          const [x0, x1, z0, z1] = extent(zc, (c) => c.position.x, (c) => c.position.z, 3);
          slab(x0, x1, z0, z1, zone === 'plant room' ? 0x1a1f33 : 0x11212a, 0.01);
        }
      }

      // Floor-painted orientation labels (hall names, zones).
      const floorLabel = (text, p) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = '600 72px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text.toUpperCase(), 256, 64);
        const tex = new THREE.CanvasTexture(canvas);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
        m.rotation.x = -Math.PI / 2;
        m.position.set(p.x, 0.03, p.z);
        scene.add(m);
      };
      for (const l of orientationLabels(facilityId)) {
        const offset = l.id.startsWith('hall-') ? 8.6 : 0;
        floorLabel(l.text, { x: l.position.x, z: l.position.z + offset });
      }

      // ── Racks: one instanced mesh ──
      const dummy = new THREE.Object3D();
      const rackMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(...RACK_SIZE), new THREE.MeshStandardMaterial({ roughness: 0.65, metalness: 0.1 }), racks.length);
      racks.forEach((r, i) => {
        dummy.position.set(r.x_m, r.y_m + RACK_SIZE[1] / 2, r.z_m);
        dummy.updateMatrix();
        rackMesh.setMatrixAt(i, dummy.matrix);
        rackMesh.setColorAt(i, new THREE.Color(STATE_STYLE.neutral.color));
      });
      rackMesh.userData.ids = racks.map((r) => r.rack_id);
      rackMesh.userData.kind = 'rack';
      scene.add(rackMesh);

      // ── Components: one instanced mesh per type ──
      const compMeshes = [];
      const compSlot = new Map(); // id -> { mesh, index }
      const byType = new Map();
      for (const c of comps) {
        if (!byType.has(c.component_type)) byType.set(c.component_type, []);
        byType.get(c.component_type).push(c);
      }
      for (const [type, list] of byType) {
        const shape = SHAPES[type];
        const [w, h, d] = shape.size;
        const geom = shape.kind === 'cyl' ? new THREE.CylinderGeometry(w * 0.85, w, h, 20) : new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.InstancedMesh(geom, new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.2 }), list.length);
        list.forEach((c, i) => {
          dummy.position.set(c.position.x, shape.hanging ? c.position.y : c.position.y + h / 2, c.position.z);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          mesh.setColorAt(i, new THREE.Color(COMPONENT_BASE[c.chain] ?? COMPONENT_BASE.electrical));
          compSlot.set(c.component_id, { mesh, index: i, shape, component: c });
        });
        mesh.userData.ids = list.map((c) => c.component_id);
        mesh.userData.kind = 'component';
        scene.add(mesh);
        compMeshes.push(mesh);
      }

      // Per-instance colour animation state.
      const makeSlots = (n) => Array.from({ length: n }, () => ({ cur: new THREE.Color(STATE_STYLE.neutral.color), target: new THREE.Color(STATE_STYLE.neutral.color), revealAt: 0, pulse: null }));
      const rackSlots = makeSlots(racks.length);
      const compSlots = new Map(comps.map((c) => [c.component_id, { cur: new THREE.Color(COMPONENT_BASE[c.chain]), target: new THREE.Color(COMPONENT_BASE[c.chain]), revealAt: 0, pulse: null }]));
      const rackIndex = new Map(racks.map((r, i) => [r.rack_id, i]));

      // Dynamic groups rebuilt per view.
      const outlineGroup = new THREE.Group();
      const flowGroup = new THREE.Group();
      scene.add(outlineGroup, flowGroup);

      // ── Screen-constant labels with collision culling ──
      const labels = [];
      const makeLabel = (text, color, priority, position, revealAt) => {
        const canvas = document.createElement('canvas');
        canvas.width = 640; canvas.height = 96;
        const ctx = canvas.getContext('2d');
        let font = 44;
        do { ctx.font = `600 ${font}px "JetBrains Mono", ui-monospace, monospace`; font -= 2; } while (ctx.measureText(text).width + 40 > 640 && font > 18);
        const textW = Math.min(632, ctx.measureText(text).width + 36);
        ctx.fillStyle = 'rgba(7, 13, 24, 0.86)';
        const x = 320 - textW / 2;
        ctx.beginPath();
        ctx.roundRect(x, 14, textW, 68, 16);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 320, 49);
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, sizeAttenuation: false }));
        sprite.center.set(0.5, -0.35);
        sprite.position.set(position.x, position.y + 2.2, position.z);
        sprite.renderOrder = 20;
        scene.add(sprite);
        labels.push({ sprite, texture, textW, priority, revealAt });
      };
      const clearLabels = () => {
        for (const l of labels) { scene.remove(l.sprite); l.texture.dispose(); l.sprite.material.dispose(); }
        labels.length = 0;
      };
      const size = { w: 0, h: 0 };
      const sizeLabels = () => {
        const p11 = camera.projectionMatrix.elements[5];
        for (const l of labels) {
          const sy = (2 * LABEL_PX * (96 / 68)) / (p11 * size.h);
          l.sprite.scale.set(sy * (640 / 96), sy, 1);
        }
      };
      const projected = new THREE.Vector3();
      const layoutLabels = (now) => {
        const placed = [];
        for (const l of labels) l.sprite.visible = false;
        const candidates = labels.filter((l) => now >= l.revealAt).sort((a, b) => b.priority - a.priority);
        for (const l of candidates) {
          projected.copy(l.sprite.position).project(camera);
          if (projected.z > 1 || Math.abs(projected.x) > 1.1 || Math.abs(projected.y) > 1.1) continue;
          const sx = ((projected.x + 1) / 2) * size.w;
          const sy = ((1 - projected.y) / 2) * size.h;
          const spriteH = LABEL_PX * (96 / 68);
          const cy = sy + (l.sprite.center.y - 0.5) * spriteH;
          const rw = (l.textW * LABEL_PX) / 68 + 6;
          const r = { x0: sx - rw / 2, x1: sx + rw / 2, y0: cy - LABEL_PX / 2 - 2, y1: cy + LABEL_PX / 2 + 2 };
          if (placed.some((p) => !(r.x1 < p.x0 || r.x0 > p.x1 || r.y1 < p.y0 || r.y0 > p.y1))) continue;
          placed.push(r);
          l.sprite.visible = true;
        }
      };

      // ── Camera framing ──
      const tween = { active: false, start: 0, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(), toTarget: new THREE.Vector3() };
      // Exact fit: binary-search the distance along the current viewing
      // direction until every corner of the target box projects inside the
      // region left visible between the side panels.
      const testCam = new THREE.PerspectiveCamera();
      const corner = new THREE.Vector3();
      const framingFor = (points) => {
        const box = new THREE.Box3();
        points.forEach((p) => box.expandByPoint(new THREE.Vector3(p.x, p.y ?? 0, p.z)));
        box.expandByScalar(points.length === 1 ? 4 : 1.5);
        box.max.y = Math.max(box.max.y, 3);
        const center = box.getCenter(new THREE.Vector3());
        const dir = camera.position.clone().sub(controls.target);
        if (dir.lengthSq() < 1e-6) dir.set(...HOME_DIRECTION);
        dir.normalize();
        const { insetLeft: il, insetRight: ir } = propsRef.current;
        const xMin = -1 + (2 * il) / size.w + 0.06, xMax = 1 - (2 * ir) / size.w - 0.06;
        testCam.copy(camera);
        const fits = (dist) => {
          testCam.position.copy(center).addScaledVector(dir, dist);
          testCam.lookAt(center);
          testCam.updateMatrixWorld();
          for (let i = 0; i < 8; i++) {
            corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(testCam);
            if (corner.z > 1 || corner.x < xMin || corner.x > xMax || corner.y < -0.9 || corner.y > 0.86) return false;
          }
          return true;
        };
        let lo = 2, hi = 500;
        for (let i = 0; i < 28; i++) {
          const mid = (lo + hi) / 2;
          if (fits(mid)) hi = mid; else lo = mid;
        }
        return { target: center, position: center.clone().addScaledVector(dir, hi) };
      };
      const homePoints = [...racks.map((r) => ({ x: r.x_m, y: 0, z: r.z_m })), ...comps.map((c) => c.position)];
      const easeTo = (points, immediate = false) => {
        const f = framingFor(points);
        if (immediate) {
          controls.target.copy(f.target);
          camera.position.copy(f.position);
          controls.update();
          return;
        }
        tween.fromPos.copy(camera.position);
        tween.toPos.copy(f.position);
        tween.fromTarget.copy(controls.target);
        tween.toTarget.copy(f.target);
        tween.start = performance.now();
        tween.active = true;
      };

      const resize = () => {
        const w = container.clientWidth, h = container.clientHeight;
        if (!w || !h) return;
        size.w = w; size.h = h;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        const { insetLeft: il, insetRight: ir } = propsRef.current;
        camera.setViewOffset(w, h, -(il - ir) / 2, 0, w, h);
        camera.updateProjectionMatrix();
        sizeLabels();
      };
      camera.position.set(...HOME_DIRECTION);
      resize();
      easeTo(homePoints, true);
      const ro = new ResizeObserver(resize);
      ro.observe(container);

      // ── Picking: hover tooltip and click ──
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const pick = (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects([rackMesh, ...compMeshes], false)[0];
        if (!hit || hit.instanceId == null) return null;
        return { kind: hit.object.userData.kind, id: hit.object.userData.ids[hit.instanceId], x: e.clientX - rect.left, y: e.clientY - rect.top };
      };
      let hoverId = null;
      let downAt = null;
      const onMove = (e) => {
        const hit = pick(e);
        const id = hit ? `${hit.kind}:${hit.id}` : null;
        if (id !== hoverId) {
          hoverId = id;
          renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
        }
        setHover(hit);
      };
      const onDown = (e) => { downAt = { x: e.clientX, y: e.clientY }; };
      const onUp = (e) => {
        if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 4) return;
        downAt = null;
        const hit = pick(e);
        if (!hit) return;
        if (hit.kind === 'rack') propsRef.current.onRackClick?.(getRack(hit.id));
        else propsRef.current.onComponentClick?.(getComponent(hit.id));
      };
      const onLeave = () => setHover(null);
      renderer.domElement.addEventListener('pointermove', onMove);
      renderer.domElement.addEventListener('pointerdown', onDown);
      renderer.domElement.addEventListener('pointerup', onUp);
      renderer.domElement.addEventListener('pointerleave', onLeave);
      controls.addEventListener('start', () => { tween.active = false; });

      // ── Applying a view ──
      const dimmedOf = (base) => base.clone().lerp(bg, 0.78);
      const styleColor = (state, base) => {
        const style = STATE_STYLE[state] ?? STATE_STYLE.neutral;
        if (style.dim) return dimmedOf(base);
        if (state === 'neutral') return base.clone();
        return new THREE.Color(style.color);
      };
      const applyView = (v) => {
        const now = performance.now();
        racks.forEach((r, i) => {
          const s = v?.rackStates?.[r.rack_id] ?? { state: r.status === 'free' ? 'free' : r.status === 'blocked' ? 'blocked' : 'neutral' };
          const slot = rackSlots[i];
          slot.target = styleColor(s.state, new THREE.Color(STATE_STYLE.neutral.color));
          slot.pulse = STATE_STYLE[s.state]?.pulse ?? null;
          slot.revealAt = now + (s.hop ?? 0) * MS_PER_HOP;
        });
        outlineGroup.clear();
        for (const c of comps) {
          const s = v?.componentStates?.[c.component_id] ?? { state: 'neutral' };
          const slot = compSlots.get(c.component_id);
          const base = new THREE.Color(COMPONENT_BASE[c.chain] ?? COMPONENT_BASE.electrical);
          slot.target = styleColor(s.state, base);
          slot.pulse = STATE_STYLE[s.state]?.pulse ?? null;
          slot.revealAt = now + (s.hop ?? 0) * MS_PER_HOP;
          if (STATE_STYLE[s.state]?.outline) {
            const { shape } = compSlot.get(c.component_id);
            const [w, h, d] = shape.size;
            const edges = new THREE.LineSegments(
              new THREE.EdgesGeometry(new THREE.BoxGeometry(w * 1.3 + 0.4, h * 1.25 + 0.3, d * 1.3 + 0.4)),
              new THREE.LineBasicMaterial({ color: s.state === 'redundancy_lost' ? 0xc084fc : 0xf87171, transparent: true, opacity: 0.95 }),
            );
            edges.position.set(c.position.x, shape.hanging ? c.position.y : c.position.y + h / 2, c.position.z);
            edges.userData.revealAt = slot.revealAt;
            edges.visible = false;
            outlineGroup.add(edges);
          }
        }
        flowGroup.clear();
        for (const line of v?.flowLines ?? []) {
          const lift = line.chain === 'thermal' ? 1.0 : 2.8;
          const geom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(line.from.x, Math.max(line.from.y, 0) + lift, line.from.z),
            new THREE.Vector3(line.to.x, Math.max(line.to.y, 0) + lift, line.to.z),
          ]);
          const mesh = new THREE.Line(geom, new THREE.LineDashedMaterial({ color: line.chain === 'thermal' ? 0x22d3ee : 0x60a5fa, dashSize: 0.9, gapSize: 0.5, transparent: true, opacity: 0.95 }));
          mesh.computeLineDistances();
          mesh.userData.revealAt = now + (line.hop - 1) * MS_PER_HOP;
          mesh.visible = false;
          flowGroup.add(mesh);
        }
        clearLabels();
        for (const l of v?.labels ?? []) {
          makeLabel(l.text, LABEL_TONE[l.tone] ?? '#e2e8f0', l.priority ?? 100, l.position, now + (l.hop ?? 0) * MS_PER_HOP);
        }
        sizeLabels();
        easeTo(v?.focusPoints?.length ? v.focusPoints : homePoints);
      };

      // ── Render loop ──
      let last = performance.now();
      let frames = 0, fpsWindowStart = last, raf = 0;
      const tmp = new THREE.Color();
      const loop = () => {
        raf = requestAnimationFrame(loop);
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        if (tween.active) {
          const t = Math.min(1, (now - tween.start) / 800);
          const e = 1 - Math.pow(1 - t, 3);
          camera.position.lerpVectors(tween.fromPos, tween.toPos, e);
          controls.target.lerpVectors(tween.fromTarget, tween.toTarget, e);
          if (t >= 1) tween.active = false;
        }
        controls.update();

        const alpha = 1 - Math.exp(-dt / 0.2);
        const pulseOf = (p) => (p === 'strong' ? 0.72 + Math.sin(now / 160) * 0.28 : p === 'soft' ? 0.85 + Math.sin(now / 320) * 0.15 : 1);
        rackSlots.forEach((slot, i) => {
          if (now < slot.revealAt) return;
          slot.cur.lerp(slot.target, alpha);
          tmp.copy(slot.cur).multiplyScalar(pulseOf(slot.pulse));
          rackMesh.setColorAt(i, tmp);
        });
        rackMesh.instanceColor.needsUpdate = true;
        for (const [id, slot] of compSlots) {
          if (now < slot.revealAt) continue;
          slot.cur.lerp(slot.target, alpha);
          tmp.copy(slot.cur).multiplyScalar(pulseOf(slot.pulse));
          const { mesh, index } = compSlot.get(id);
          mesh.setColorAt(index, tmp);
        }
        compMeshes.forEach((m) => { m.instanceColor.needsUpdate = true; });
        for (const o of outlineGroup.children) o.visible = now >= o.userData.revealAt;
        for (const l of flowGroup.children) {
          l.visible = now >= l.userData.revealAt;
          l.material.dashOffset -= dt * 2.2;
        }
        layoutLabels(now);
        renderer.render(scene, camera);

        frames += 1;
        if (now - fpsWindowStart >= 1000) {
          container.dataset.fps = String(Math.round((frames * 1000) / (now - fpsWindowStart)));
          frames = 0;
          fpsWindowStart = now;
        }
      };
      loop();

      sceneRef.current = { applyView, resize, easeTo, homePoints };
      if (propsRef.current.pendingView) applyView(propsRef.current.pendingView);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.domElement.removeEventListener('pointermove', onMove);
        renderer.domElement.removeEventListener('pointerdown', onDown);
        renderer.domElement.removeEventListener('pointerup', onUp);
        renderer.domElement.removeEventListener('pointerleave', onLeave);
        controls.dispose();
        clearLabels();
        renderer.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      };
    });

    return () => {
      disposed = true;
      cleanup();
      sceneRef.current = null;
    };
  }, [facilityId]);

  // Apply each new view (or re-run of the same view).
  useEffect(() => {
    propsRef.current.pendingView = view;
    sceneRef.current?.applyView(view);
  }, [view, runKey]);

  // Re-centre when side panels open or close.
  useEffect(() => {
    sceneRef.current?.resize();
  }, [insetLeft, insetRight]);

  const hoverInfo = hover ? describe(hover, view) : null;

  return (
    <div className="absolute inset-0 overflow-hidden" data-testid="nexus-twin">
      <div ref={mountRef} className="absolute inset-0" />
      {hoverInfo && (
        <div className="absolute z-10 pointer-events-none bg-[#0a1220]/95 border border-white/15 rounded-lg px-2.5 py-1.5 shadow-xl max-w-[260px]" style={{ left: hover.x + 14, top: hover.y + 14 }}>
          <p className="text-[11px] font-semibold text-white">{hoverInfo.title}</p>
          {hoverInfo.lines.map((line) => <p key={line} className="text-[10px] text-white/55 font-mono">{line}</p>)}
        </div>
      )}
    </div>
  );
}

function describe(hover, view) {
  if (hover.kind === 'rack') {
    const r = getRack(hover.id);
    const state = view?.rackStates?.[r.rack_id]?.state;
    return {
      title: r.rack_id,
      lines: [
        `Row ${r.row_id} · ${r.status}${r.tenant_id ? ` · ${r.tenant_id}` : ''}`,
        `${r.used_kw} / ${r.capacity_kw} kW`,
        ...(state && !['neutral', 'free', 'dimmed'].includes(state) ? [state.replace('_', ' ')] : []),
      ],
    };
  }
  const c = getComponent(hover.id);
  const label = view?.labels?.find((l) => l.id === c.component_id);
  return {
    title: `${c.label}`,
    lines: [
      `${c.component_id} · ${c.component_type.replace('_', ' ')} · ${c.redundancy}`,
      `${c.current_load} / ${c.capacity} ${c.unit} (derate ${c.derate_factor})`,
      ...(label ? [label.text] : []),
    ],
  };
}
