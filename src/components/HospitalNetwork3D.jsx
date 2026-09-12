"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { ShieldAlert, CheckCircle2, Clock, RotateCcw } from "lucide-react";

export default function HospitalNetwork3D({ facilities = [], onSelectFacility }) {
  const mountRef = useRef(null);
  const [hoveredFacility, setHoveredFacility] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const testCanvas = document.createElement("canvas");
      return Boolean(testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  });

  // Quick stats computed for the 3D header
  const totalOverdue = useMemo(() => {
    return facilities.reduce((sum, f) => sum + (f.overdueVerifier || 0), 0);
  }, [facilities]);

  useEffect(() => {
    if (!isSupported) return;
    const container = mountRef.current;
    if (!container) return;

    // 2. Scene, Camera, Renderer Setup
    const width = container.clientWidth;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 10, 22);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power", // Optimized for mobile GPUs
    });
    renderer.setSize(width, height);
    // Cap DPR at 1.5 to protect mobile GPUs & battery
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0); // Transparent background
    container.appendChild(renderer.domElement);

    // 3. Central Hub (Operator Command HQ)
    const centralGroup = new THREE.Group();
    scene.add(centralGroup);

    // Central core sphere (low poly, 16x16)
    const centralGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const centralMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed, // Purple command color
      wireframe: true,
    });
    const centralCore = new THREE.Mesh(centralGeo, centralMat);
    centralGroup.add(centralCore);

    // Inner glowing core
    const innerGeo = new THREE.SphereGeometry(0.7, 12, 12);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    centralGroup.add(innerCore);

    // Central orbital rings
    const ringGeo = new THREE.RingGeometry(1.8, 1.88, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    centralGroup.add(ring);

    // 4. Position Hospital Nodes in an organic district grid
    const nodeMeshes = [];
    const connectionLines = [];
    const count = facilities.length || 606;

    // Procedural particle geometry for nodes
    const nodeGeo = new THREE.SphereGeometry(0.42, 10, 10);

    // Colors
    const colorOverdue = new THREE.Color(0xef4444); // Red
    const colorPending = new THREE.Color(0x3b82f6); // Blue
    const colorCompliant = new THREE.Color(0x10b981); // Emerald
    const colorIdle = new THREE.Color(0x64748b); // Slate

    // Create 39 nodes in an elliptical constellation
    for (let i = 0; i < count; i++) {
      const fac = facilities[i] || { facility: `Hospital ${i + 1}`, overdueVerifier: 0, pendingVerifier: 0 };
      const isOverdue = fac.overdueVerifier > 0;
      const isPending = fac.pendingVerifier > 0;

      // Golden spiral distribution in 3D space
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const radius = 7 + (i % 3) * 1.5;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = (radius * 0.35 * Math.sin(phi) * Math.sin(theta)) + ((i % 4) - 1.5) * 0.8;
      const z = radius * Math.cos(phi);

      // Node color by status
      let nodeColor = colorCompliant;
      if (isOverdue) nodeColor = colorOverdue;
      else if (isPending) nodeColor = colorPending;
      else if (fac.totalReceived === 0) nodeColor = colorIdle;

      const nodeMat = new THREE.MeshBasicMaterial({
        color: nodeColor,
      });

      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(x, y, z);
      nodeMesh.userData = {
        facilityData: fac,
        originalColor: nodeColor,
        basePos: new THREE.Vector3(x, y, z),
        phase: Math.random() * Math.PI * 2,
        isOverdue,
      };

      scene.add(nodeMesh);
      nodeMeshes.push(nodeMesh);

      // 5. Connecting Line to Central Hub
      const lineMat = new THREE.LineBasicMaterial({
        color: isOverdue ? 0xef4444 : (isPending ? 0x6366f1 : 0x334155),
        transparent: true,
        opacity: isOverdue ? 0.65 : 0.25,
      });

      const linePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      connectionLines.push(line);
    }

    // 6. Traveling Data Pulse Particles along lines
    const pulseCount = 24;
    const pulsePositions = new Float32Array(pulseCount * 3);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePositions, 3));
    const pulseMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.28,
      transparent: true,
      opacity: 0.85,
    });
    const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
    scene.add(pulsePoints);

    // Pulse animation state
    const pulseT = Array.from({ length: pulseCount }, () => Math.random());
    const pulseTargets = Array.from({ length: pulseCount }, () => Math.floor(Math.random() * count));

    // 7. Interactive Controls & Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0.2;
    let targetRotationY = 0;
    let isDragging = false;
    let previousPointerX = 0;
    let previousPointerY = 0;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      mouse.x = (clientX / rect.width) * 2 - 1;
      mouse.y = -(clientY / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - previousPointerX;
        const deltaY = e.clientY - previousPointerY;
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.003;
        targetRotationX = Math.max(-0.6, Math.min(0.8, targetRotationX));
      } else {
        mouseX = (e.clientX - rect.left - rect.width / 2) * 0.0003;
        mouseY = (e.clientY - rect.top - rect.height / 2) * 0.0003;
      }

      previousPointerX = e.clientX;
      previousPointerY = e.clientY;

      setTooltipPos({ x: clientX, y: clientY });
    };

    const onPointerDown = (e) => {
      isDragging = true;
      previousPointerX = e.clientX;
      previousPointerY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);
      if (intersects.length > 0) {
        const fac = intersects[0].object.userData.facilityData;
        if (fac && onSelectFacility) {
          onSelectFacility(fac.facility);
        }
      }
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    container.addEventListener("click", onClick);

    // 8. Visibility / Battery Optimization with IntersectionObserver
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // 9. Render Loop
    let animationId;
    const timer = typeof THREE.Timer === "function" ? new THREE.Timer() : null;
    const startTime = performance.now();

    const animate = (timestamp) => {
      animationId = requestAnimationFrame(animate);

      // Pause WebGL compute when scrolled off screen
      if (!isVisible) return;

      let elapsed;
      if (timer) {
        timer.update(timestamp);
        elapsed = timer.getElapsed();
      } else {
        elapsed = (performance.now() - startTime) * 0.001;
      }

      // Smooth camera orbit
      if (!isDragging) {
        targetRotationY += 0.0015; // Slow gentle rotation
      }
      scene.rotation.y += (targetRotationY - scene.rotation.y) * 0.05;
      scene.rotation.x += (targetRotationX - scene.rotation.x) * 0.05;

      // Central core pulse
      centralCore.rotation.y = elapsed * 0.5;
      centralCore.rotation.x = elapsed * 0.25;
      ring.rotation.z = -elapsed * 0.3;

      // Pulse nodes (red alert nodes pulse faster & expand)
      for (let i = 0; i < nodeMeshes.length; i++) {
        const mesh = nodeMeshes[i];
        const { isOverdue, phase, basePos } = mesh.userData;

        // Floating gentle hover
        const floatY = Math.sin(elapsed * 1.5 + phase) * 0.15;
        mesh.position.y = basePos.y + floatY;

        // Pulsing scale for overdue hospitals
        if (isOverdue) {
          const pulseScale = 1.0 + Math.sin(elapsed * 4 + phase) * 0.35;
          mesh.scale.set(pulseScale, pulseScale, pulseScale);
        }
      }

      // Update traveling data pulse particles
      const posAttr = pulseGeo.attributes.position;
      for (let i = 0; i < pulseCount; i++) {
        pulseT[i] += 0.008;
        if (pulseT[i] >= 1) {
          pulseT[i] = 0;
          pulseTargets[i] = Math.floor(Math.random() * count);
        }

        const targetMesh = nodeMeshes[pulseTargets[i]];
        if (targetMesh) {
          const targetPos = targetMesh.position;
          const px = targetPos.x * pulseT[i];
          const py = targetPos.y * pulseT[i];
          const pz = targetPos.z * pulseT[i];
          posAttr.setXYZ(i, px, py, pz);
        }
      }
      posAttr.needsUpdate = true;

      // Raycasting for interactive hover tooltip
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        hit.material.color.set(0xffffff); // Glow white on hover
        hit.scale.set(1.5, 1.5, 1.5);
        setHoveredFacility(hit.userData.facilityData);
        container.style.cursor = "pointer";
      } else {
        nodeMeshes.forEach((mesh) => {
          mesh.material.color.copy(mesh.userData.originalColor);
          if (!mesh.userData.isOverdue) {
            mesh.scale.set(1, 1, 1);
          }
        });
        setHoveredFacility(null);
        container.style.cursor = "grab";
      }

      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 360;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // 11. Complete Clean up
    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("click", onClick);

      // Dispose geometries & materials
      centralGeo.dispose();
      centralMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      nodeGeo.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();

      connectionLines.forEach((l) => {
        l.geometry.dispose();
        l.material.dispose();
      });

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      timer?.dispose?.();
      renderer.dispose();
    };
  }, [facilities, onSelectFacility, isSupported]);

  // Graceful 2D Fallback for legacy devices without WebGL
  if (!isSupported) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        borderRadius: 16, padding: 30, color: "white", textAlign: "center",
      }}>
        <ShieldAlert size={36} color="#fbbf24" style={{ margin: "0 auto 10px" }} />
        <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>{facilities.length || 606} Facilities Digital Grid (2D Mode)</h4>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
          Active monitoring: {facilities.length} health centers • {totalOverdue} overdue applications.
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: 380, borderRadius: 16, overflow: "hidden", background: "radial-gradient(ellipse at center, #1e1b4b 0%, #0f172a 80%)", border: "1px solid #334155", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}>
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} style={{ width: "100%", height: "100%", touchAction: "none" }} />

      {/* Top Overlay Badge & Instructions */}
      <div style={{ position: "absolute", top: 16, left: 16, pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(8px)", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: totalOverdue > 0 ? "#ef4444" : "#10b981", display: "inline-block", boxShadow: totalOverdue > 0 ? "0 0 8px #ef4444" : "0 0 8px #10b981" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#f8fafc", letterSpacing: "0.5px" }}>
            DIGITAL BIHAR • {facilities.length || 606} HEALTH FACILITIES TOPOLOGY
          </span>
        </div>
        <p style={{ margin: "6px 0 0 2px", fontSize: 11, color: "#94a3b8" }}>
          Drag to rotate • Hover / tap node to inspect • Real-time SLA pulses
        </p>
      </div>

      {/* Legend Overlay */}
      <div style={{ position: "absolute", bottom: 14, left: 16, display: "flex", gap: 14, background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(8px)", padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", pointerEvents: "none", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#f1f5f9", fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
          Overdue (&gt;7 Days)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#f1f5f9", fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />
          Pending (&le;7 Days)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#f1f5f9", fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          Compliant / Done
        </div>
      </div>

      {/* Central Hub Legend */}
      <div style={{ position: "absolute", bottom: 14, right: 16, pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(124, 58, 237, 0.3)", border: "1px solid rgba(139, 92, 246, 0.4)", backdropFilter: "blur(8px)", padding: "6px 12px", borderRadius: 8, fontSize: 11, color: "#e9d5ff", fontWeight: 700 }}>
          🟣 Center: Operator Command HQ
        </div>
      </div>

      {/* Interactive Tooltip on Node Hover */}
      {hoveredFacility && (
        <div style={{
          position: "absolute",
          left: tooltipPos.x > 260 ? Math.max(10, tooltipPos.x - 270) : tooltipPos.x + 12,
          top: Math.max(10, tooltipPos.y - 75),
          pointerEvents: "none",
          zIndex: 50,
          background: "rgba(15, 23, 42, 0.92)",
          backdropFilter: "blur(12px)",
          border: hoveredFacility.overdueVerifier > 0 ? "1.5px solid #ef4444" : "1px solid #475569",
          borderRadius: 10,
          padding: "10px 14px",
          color: "white",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
          minWidth: 220,
          maxWidth: 280,
          animation: "fadeIn 0.15s ease-out",
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fafc", lineHeight: 1.2, marginBottom: 4 }}>
            {hoveredFacility.facility}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4, color: "#94a3b8" }}>
            <span>Total Received:</span>
            <strong style={{ color: "#f1f5f9" }}>{hoveredFacility.totalReceived}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 2, color: "#94a3b8" }}>
            <span>Pending (≤7d):</span>
            <strong style={{ color: "#38bdf8" }}>{hoveredFacility.onTrackVerifier}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 2, color: "#94a3b8" }}>
            <span>Overdue (&gt;7d):</span>
            <strong style={{ color: hoveredFacility.overdueVerifier > 0 ? "#f87171" : "#94a3b8" }}>
              {hoveredFacility.overdueVerifier > 0 ? `🚨 ${hoveredFacility.overdueVerifier}` : "0"}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 2, color: "#94a3b8" }}>
            <span>SLA Compliance:</span>
            <strong style={{ color: hoveredFacility.complianceRate >= 90 ? "#4ade80" : "#fbbf24" }}>
              {hoveredFacility.complianceRate}%
            </strong>
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: "#cbd5e1", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 4 }}>
            Click node to jump to table
          </div>
        </div>
      )}
    </div>
  );
}
