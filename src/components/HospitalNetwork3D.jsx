"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import {
  Building2,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Search,
  Layers,
  Activity,
  Filter,
  ChevronRight,
  RotateCcw,
  Eye,
  AlertTriangle,
  Grid,
  MapPin,
  X,
  ExternalLink,
  Zap,
  Sparkles,
  Compass,
} from "lucide-react";
import { FACILITIES_DATA, FACILITIES_BY_BLOCK } from "@/utils/constants";

// Administrative blocks of Madhubani District (21 Blocks, 606 Facilities)
const BLOCK_NAMES = Object.keys(FACILITIES_BY_BLOCK).sort((a, b) => a.localeCompare(b));

// Map block positions in an elliptical district layout
const BLOCK_LAYOUT = {};
BLOCK_NAMES.forEach((block, idx) => {
  const angle = (idx / BLOCK_NAMES.length) * Math.PI * 2;
  const radiusX = 14;
  const radiusZ = 10.5;
  BLOCK_LAYOUT[block] = {
    x: Math.cos(angle) * radiusX,
    z: Math.sin(angle) * radiusZ,
    y: Math.sin(angle * 3) * 1.2,
    angle,
  };
});

// Facility Type Badges and Colors
const TYPE_COLORS = {
  DH: { color: "#ec4899", label: "District Hospital" },
  SDH: { color: "#a855f7", label: "Sub-Divisional Hospital" },
  CHC: { color: "#3b82f6", label: "Community Health Centre" },
  PHC: { color: "#06b6d4", label: "Primary Health Centre" },
  APHC: { color: "#10b981", label: "Additional PHC" },
  HSC: { color: "#64748b", label: "Health Sub-Centre" },
};

export default function HospitalNetwork3D({ facilities = [], onSelectFacility }) {
  const mountRef = useRef(null);

  // View mode: '3d' | 'heatmap' | 'radar'
  const [viewMode, setViewMode] = useState("3d");

  // Selection & Filter State
  const [selectedBlock, setSelectedBlock] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | OVERDUE | PENDING | COMPLIANT
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [showAllIn3D, setShowAllIn3D] = useState(false);

  // 3D camera & scene refs for smooth transitions
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const targetCameraPosRef = useRef(new THREE.Vector3(0, 14, 26));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const isInteractingRef = useRef(false);

  // Check WebGL support
  const [isSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const canvas = document.createElement("canvas");
      return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  });

  // Merge 606 Master Facilities with real-time statistics
  const masterFacilities = useMemo(() => {
    const statsMap = new Map();
    if (Array.isArray(facilities)) {
      for (const f of facilities) {
        if (f?.facility) {
          statsMap.set(f.facility.trim(), f);
          const upper = f.facility.toUpperCase().trim();
          if (!statsMap.has(upper)) {
            statsMap.set(upper, f);
          }
        }
      }
    }

    return FACILITIES_DATA.map((fac) => {
      const stat = statsMap.get(fac.name.trim()) || statsMap.get(fac.name.toUpperCase().trim()) || {};
      const totalReceived = stat.totalReceived || 0;
      const pendingVerifier = stat.pendingVerifier || 0;
      const overdueVerifier = stat.overdueVerifier || 0;
      const onTrackVerifier = stat.onTrackVerifier || 0;
      const verifiedCount = stat.verifiedCount || 0;
      const complianceRate = stat.complianceRate !== undefined ? stat.complianceRate : 100;
      const avgTurnaroundDays = stat.avgTurnaroundDays || "—";

      let status = "IDLE";
      if (overdueVerifier > 0) status = "OVERDUE";
      else if (pendingVerifier > 0) status = "PENDING";
      else if (totalReceived > 0) status = "COMPLIANT";

      return {
        ...fac,
        facility: fac.name,
        totalReceived,
        pendingVerifier,
        overdueVerifier,
        onTrackVerifier,
        verifiedCount,
        complianceRate,
        avgTurnaroundDays,
        status,
      };
    });
  }, [facilities]);

  // Aggregate statistics by Block
  const blockSummaries = useMemo(() => {
    const summary = {};
    BLOCK_NAMES.forEach((blockName) => {
      const facs = masterFacilities.filter((f) => f.block === blockName);
      const total = facs.length;
      const overdue = facs.reduce((sum, f) => sum + f.overdueVerifier, 0);
      const pending = facs.reduce((sum, f) => sum + f.pendingVerifier, 0);
      const received = facs.reduce((sum, f) => sum + f.totalReceived, 0);
      const verified = facs.reduce((sum, f) => sum + f.verifiedCount, 0);
      const compliantRate =
        received > 0 ? Math.max(0, Math.round(((received - overdue) / received) * 100)) : 100;

      let healthStatus = "COMPLIANT";
      if (overdue > 0) healthStatus = "OVERDUE";
      else if (pending > 0) healthStatus = "PENDING";

      summary[blockName] = {
        name: blockName,
        total,
        overdue,
        pending,
        received,
        verified,
        compliantRate,
        healthStatus,
        facilities: facs,
      };
    });
    return summary;
  }, [masterFacilities]);

  // Overall District Totals
  const districtStats = useMemo(() => {
    const totalFacilities = masterFacilities.length;
    const totalOverdue = masterFacilities.reduce((sum, f) => sum + f.overdueVerifier, 0);
    const totalPending = masterFacilities.reduce((sum, f) => sum + f.pendingVerifier, 0);
    const totalReceived = masterFacilities.reduce((sum, f) => sum + f.totalReceived, 0);
    const overdueFacilitiesCount = masterFacilities.filter((f) => f.overdueVerifier > 0).length;
    const activeFacilitiesCount = masterFacilities.filter((f) => f.pendingVerifier > 0).length;
    const complianceRate =
      totalReceived > 0
        ? Math.max(0, Math.round(((totalReceived - totalOverdue) / totalReceived) * 100))
        : 100;

    return {
      totalFacilities,
      totalOverdue,
      totalPending,
      totalReceived,
      overdueFacilitiesCount,
      activeFacilitiesCount,
      complianceRate,
    };
  }, [masterFacilities]);

  // Filtered facilities for Search, Heatmap & Radar
  const filteredFacilities = useMemo(() => {
    return masterFacilities.filter((fac) => {
      if (selectedBlock !== "ALL" && fac.block !== selectedBlock) return false;
      if (statusFilter === "OVERDUE" && fac.overdueVerifier === 0) return false;
      if (statusFilter === "PENDING" && fac.pendingVerifier === 0) return false;
      if (statusFilter === "COMPLIANT" && (fac.overdueVerifier > 0 || fac.totalReceived === 0))
        return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = fac.name.toLowerCase().includes(query);
        const matchesBlock = fac.block.toLowerCase().includes(query);
        const matchesType = fac.type.toLowerCase().includes(query);
        const matchesPin = (fac.pin || "").includes(query);
        const matchesUser = (fac.username || "").toLowerCase().includes(query);
        return matchesName || matchesBlock || matchesType || matchesPin || matchesUser;
      }
      return true;
    });
  }, [masterFacilities, selectedBlock, statusFilter, searchQuery]);

  // Facilities needing immediate attention (Overdue / High SLA queue)
  const criticalRadarFacilities = useMemo(() => {
    return masterFacilities
      .filter((f) => f.overdueVerifier > 0 || f.pendingVerifier > 0)
      .sort((a, b) => {
        if (b.overdueVerifier !== a.overdueVerifier) {
          return b.overdueVerifier - a.overdueVerifier;
        }
        return b.pendingVerifier - a.pendingVerifier;
      });
  }, [masterFacilities]);

  // Handle focusing on a specific block
  const handleFocusBlock = useCallback((blockName) => {
    setSelectedBlock(blockName);
    if (blockName === "ALL") {
      targetCameraPosRef.current.set(0, 14, 26);
      targetLookAtRef.current.set(0, 0, 0);
    } else {
      const pos = BLOCK_LAYOUT[blockName];
      if (pos) {
        targetCameraPosRef.current.set(pos.x * 0.9, pos.y + 5, pos.z + 8.5);
        targetLookAtRef.current.set(pos.x, pos.y, pos.z);
      }
    }
  }, []);

  // Reset all filters and camera
  const handleReset = useCallback(() => {
    setSelectedBlock("ALL");
    setStatusFilter("ALL");
    setSearchQuery("");
    setSelectedFacility(null);
    targetCameraPosRef.current.set(0, 14, 26);
    targetLookAtRef.current.set(0, 0, 0);
  }, []);

  // Jump to page audit directory
  const handleAuditInDirectory = useCallback(
    (facilityName) => {
      if (onSelectFacility) {
        onSelectFacility(facilityName);
      }
    },
    [onSelectFacility]
  );

  // ==========================================
  // Three.js 3D WebGL District Scene Setup
  // ==========================================
  useEffect(() => {
    if (!isSupported || viewMode !== "3d") return;
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x090d16, 0.022);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    cameraRef.current = camera;
    camera.position.copy(targetCameraPosRef.current);
    camera.lookAt(currentLookAtRef.current);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 2. Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xc084fc, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x7c3aed, 2.5, 35);
    pointLight.position.set(0, 2, 0);
    scene.add(pointLight);

    // 3. Central District Command HQ Core (Madhubani Central)
    const centralGroup = new THREE.Group();
    scene.add(centralGroup);

    // Outer wireframe command core
    const coreIcosaGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const coreIcosaMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const coreIcosa = new THREE.Mesh(coreIcosaGeo, coreIcosaMat);
    centralGroup.add(coreIcosa);

    // Inner glowing power nucleus
    const nucleusGeo = new THREE.SphereGeometry(0.85, 16, 16);
    const nucleusMat = new THREE.MeshBasicMaterial({
      color: districtStats.totalOverdue > 0 ? 0xf43f5e : 0xa855f7,
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    centralGroup.add(nucleus);

    // Central command orbital halo ring
    const haloGeo = new THREE.RingGeometry(2.4, 2.48, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    centralGroup.add(halo);

    // District Boundary Grid Floor
    const gridHelper = new THREE.GridHelper(36, 18, 0x334155, 0x1e293b);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    // 4. District Block Hubs (21 Administrative Regional Hubs)
    const blockMeshes = [];
    const spokeLines = [];
    const facilityMeshes = [];
    const facilityLocalLines = [];

    // Geometries
    const blockHubGeo = new THREE.OctahedronGeometry(0.85, 0);
    const facilityGeo = new THREE.SphereGeometry(0.32, 10, 10);
    const dhGeo = new THREE.IcosahedronGeometry(0.5, 0);

    // Colors
    const colOverdue = new THREE.Color(0xef4444);
    const colPending = new THREE.Color(0x38bdf8);
    const colCompliant = new THREE.Color(0x10b981);
    const colIdle = new THREE.Color(0x475569);

    BLOCK_NAMES.forEach((blockName) => {
      const summary = blockSummaries[blockName];
      const pos = BLOCK_LAYOUT[blockName];
      if (!summary || !pos) return;

      const isBlockOverdue = summary.overdue > 0;
      const isBlockPending = summary.pending > 0;

      let hubColor = colCompliant;
      if (isBlockOverdue) hubColor = colOverdue;
      else if (isBlockPending) hubColor = colPending;
      else if (summary.received === 0) hubColor = colIdle;

      // Sizing scaled by facility count (13 to 59)
      const hubScale = 0.7 + (summary.total / 60) * 0.45;

      const hubMat = new THREE.MeshStandardMaterial({
        color: hubColor,
        roughness: 0.3,
        metalness: 0.8,
        wireframe: false,
      });

      const hubMesh = new THREE.Mesh(blockHubGeo, hubMat);
      hubMesh.position.set(pos.x, pos.y, pos.z);
      hubMesh.scale.set(hubScale, hubScale, hubScale);
      hubMesh.userData = {
        type: "BLOCK_HUB",
        blockName,
        summary,
        basePos: new THREE.Vector3(pos.x, pos.y, pos.z),
        isOverdue: isBlockOverdue,
        originalColor: hubColor.clone(),
      };

      scene.add(hubMesh);
      blockMeshes.push(hubMesh);

      // Spoke line from Central District HQ to this Block Hub
      const spokeMat = new THREE.LineBasicMaterial({
        color: isBlockOverdue ? 0xef4444 : isBlockPending ? 0x6366f1 : 0x334155,
        transparent: true,
        opacity: isBlockOverdue ? 0.75 : isBlockPending ? 0.45 : 0.22,
      });
      const spokeGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(pos.x, pos.y, pos.z),
      ]);
      const spoke = new THREE.Line(spokeGeo, spokeMat);
      scene.add(spoke);
      spokeLines.push(spoke);

      // 5. Facilities belonging to this block
      // If a block is focused OR showAllIn3D is enabled, render the facility nodes
      const shouldRenderFacs = selectedBlock === blockName || showAllIn3D;
      const blockFacs = summary.facilities || [];

      if (shouldRenderFacs) {
        const facCount = blockFacs.length;
        blockFacs.forEach((fac, fIdx) => {
          // Arrange in concentric rings around the block hub
          const facAngle = (fIdx / facCount) * Math.PI * 2;
          const isHighLevel = fac.type === "DH" || fac.type === "SDH" || fac.type === "CHC";
          const facRadius = selectedBlock === blockName ? (isHighLevel ? 2.5 : 3.8) : 1.4;

          const fx = pos.x + Math.cos(facAngle) * facRadius;
          const fz = pos.z + Math.sin(facAngle) * facRadius;
          const fy = pos.y + (isHighLevel ? 0.5 : (fIdx % 3 - 1) * 0.3);

          let fCol = colCompliant;
          if (fac.overdueVerifier > 0) fCol = colOverdue;
          else if (fac.pendingVerifier > 0) fCol = colPending;
          else if (fac.totalReceived === 0) fCol = colIdle;

          const fMat = new THREE.MeshBasicMaterial({ color: fCol });
          const useGeo = isHighLevel ? dhGeo : facilityGeo;
          const fMesh = new THREE.Mesh(useGeo, fMat);

          const scale = isHighLevel ? 1.25 : fac.type === "PHC" || fac.type === "APHC" ? 1.0 : 0.75;
          fMesh.position.set(fx, fy, fz);
          fMesh.scale.set(scale, scale, scale);
          fMesh.userData = {
            type: "FACILITY",
            facilityData: fac,
            basePos: new THREE.Vector3(fx, fy, fz),
            parentBlock: blockName,
            isOverdue: fac.overdueVerifier > 0,
            originalColor: fCol.clone(),
          };

          scene.add(fMesh);
          facilityMeshes.push(fMesh);

          // Subtle local spoke line to parent block hub only (Zero tangle!)
          const fLineMat = new THREE.LineBasicMaterial({
            color: fac.overdueVerifier > 0 ? 0xef4444 : 0x475569,
            transparent: true,
            opacity: fac.overdueVerifier > 0 ? 0.8 : 0.25,
          });
          const fLineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pos.x, pos.y, pos.z),
            new THREE.Vector3(fx, fy, fz),
          ]);
          const fLine = new THREE.Line(fLineGeo, fLineMat);
          scene.add(fLine);
          facilityLocalLines.push(fLine);
        });
      }
    });

    // 6. Data Pulse Particles along active spokes
    const pulseCount = 20;
    const pulsePositions = new Float32Array(pulseCount * 3);
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePositions, 3));
    const pulseMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.32,
      transparent: true,
      opacity: 0.9,
    });
    const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
    scene.add(pulsePoints);

    const pulseT = Array.from({ length: pulseCount }, () => Math.random());
    const pulseTargets = Array.from({ length: pulseCount }, () =>
      Math.floor(Math.random() * BLOCK_NAMES.length)
    );

    // 7. Interactive Pointer & Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let sceneRotY = 0;
    let sceneRotX = 0.2;

    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      mouse.x = (cx / rect.width) * 2 - 1;
      mouse.y = -(cy / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        sceneRotY += dx * 0.005;
        sceneRotX += dy * 0.003;
        sceneRotX = Math.max(-0.6, Math.min(0.85, sceneRotX));
      }

      prevX = e.clientX;
      prevY = e.clientY;
      setTooltipPos({ x: cx, y: cy });
    };

    const onPointerDown = (e) => {
      isDragging = true;
      isInteractingRef.current = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
      isInteractingRef.current = false;
    };

    const onCanvasClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const allClickables = [...facilityMeshes, ...blockMeshes];
      const hits = raycaster.intersectObjects(allClickables);

      if (hits.length > 0) {
        const target = hits[0].object;
        if (target.userData.type === "BLOCK_HUB") {
          handleFocusBlock(target.userData.blockName);
        } else if (target.userData.type === "FACILITY") {
          setSelectedFacility(target.userData.facilityData);
        }
      }
    };

    // Zoom on wheel
    const onWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.015;
      const camDir = new THREE.Vector3().subVectors(camera.position, currentLookAtRef.current);
      const newDist = THREE.MathUtils.clamp(camDir.length() + zoomFactor, 6, 45);
      camDir.setLength(newDist);
      targetCameraPosRef.current.copy(currentLookAtRef.current).add(camDir);
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    container.addEventListener("click", onCanvasClick);
    container.addEventListener("wheel", onWheel, { passive: false });

    // 8. Visibility IntersectionObserver
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // 9. Animation Render Loop
    const startTime = performance.now();

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = (performance.now() - startTime) * 0.001;

      // Auto rotation when idle
      if (autoRotate && !isDragging && selectedBlock === "ALL") {
        sceneRotY += 0.0012;
      }

      // Smooth Camera LERP towards target
      camera.position.lerp(targetCameraPosRef.current, 0.08);
      currentLookAtRef.current.lerp(targetLookAtRef.current, 0.08);
      camera.lookAt(currentLookAtRef.current);

      // Smooth scene tilt & orbit
      scene.rotation.y += (sceneRotY - scene.rotation.y) * 0.08;
      scene.rotation.x += (sceneRotX - scene.rotation.x) * 0.08;

      // Core rotations
      coreIcosa.rotation.y = elapsed * 0.4;
      coreIcosa.rotation.x = elapsed * 0.2;
      halo.rotation.z = -elapsed * 0.3;

      // Pulse Central Nucleus
      const nucleusPulse = 1.0 + Math.sin(elapsed * 2.5) * 0.08;
      nucleus.scale.set(nucleusPulse, nucleusPulse, nucleusPulse);

      // Animate Block Hubs (Gentle floating + Overdue pulse)
      blockMeshes.forEach((mesh, idx) => {
        const { basePos, isOverdue } = mesh.userData;
        const floatOffset = Math.sin(elapsed * 2 + idx) * 0.12;
        mesh.position.y = basePos.y + floatOffset;
        mesh.rotation.y = elapsed * 0.6 + idx;

        if (isOverdue) {
          const alertPulse = 1.0 + Math.sin(elapsed * 5 + idx) * 0.25;
          const origScale = 0.7 + (mesh.userData.summary.total / 60) * 0.45;
          mesh.scale.set(origScale * alertPulse, origScale * alertPulse, origScale * alertPulse);
        }
      });

      // Animate Facility Nodes
      facilityMeshes.forEach((fMesh, idx) => {
        const { basePos, isOverdue } = fMesh.userData;
        const fFloat = Math.sin(elapsed * 2.2 + idx) * 0.08;
        fMesh.position.y = basePos.y + fFloat;

        if (isOverdue) {
          const fPulse = 1.0 + Math.sin(elapsed * 6 + idx) * 0.3;
          fMesh.scale.set(fPulse, fPulse, fPulse);
        }
      });

      // Update traveling data pulse particles
      const posAttr = pulseGeo.attributes.position;
      for (let i = 0; i < pulseCount; i++) {
        pulseT[i] += 0.007;
        if (pulseT[i] >= 1) {
          pulseT[i] = 0;
          pulseTargets[i] = Math.floor(Math.random() * BLOCK_NAMES.length);
        }

        const bName = BLOCK_NAMES[pulseTargets[i]];
        const bPos = BLOCK_LAYOUT[bName];
        if (bPos) {
          const px = bPos.x * pulseT[i];
          const py = bPos.y * pulseT[i];
          const pz = bPos.z * pulseT[i];
          posAttr.setXYZ(i, px, py, pz);
        }
      }
      posAttr.needsUpdate = true;

      // Raycasting for interactive hover
      raycaster.setFromCamera(mouse, camera);
      const clickables = [...facilityMeshes, ...blockMeshes];
      const intersects = raycaster.intersectObjects(clickables);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        hit.scale.multiplyScalar(1.05);
        container.style.cursor = "pointer";

        if (hit.userData.type === "BLOCK_HUB") {
          setHoveredNode({
            type: "BLOCK",
            data: hit.userData.summary,
          });
        } else if (hit.userData.type === "FACILITY") {
          setHoveredNode({
            type: "FACILITY",
            data: hit.userData.facilityData,
          });
        }
      } else {
        container.style.cursor = isDragging ? "grabbing" : "grab";
        setHoveredNode(null);

        // Reset scales
        blockMeshes.forEach((m) => {
          if (!m.userData.isOverdue) {
            const baseScale = 0.7 + (m.userData.summary.total / 60) * 0.45;
            m.scale.set(baseScale, baseScale, baseScale);
          }
        });
        facilityMeshes.forEach((f) => {
          if (!f.userData.isOverdue) {
            const isHL =
              f.userData.facilityData.type === "DH" ||
              f.userData.facilityData.type === "SDH" ||
              f.userData.facilityData.type === "CHC";
            const s = isHL ? 1.25 : 1.0;
            f.scale.set(s, s, s);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("click", onCanvasClick);
      container.removeEventListener("wheel", onWheel);

      // Disposals
      coreIcosaGeo.dispose();
      coreIcosaMat.dispose();
      nucleusGeo.dispose();
      nucleusMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      blockHubGeo.dispose();
      facilityGeo.dispose();
      dhGeo.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();

      spokeLines.forEach((l) => {
        l.geometry.dispose();
        l.material.dispose();
      });
      facilityLocalLines.forEach((l) => {
        l.geometry.dispose();
        l.material.dispose();
      });

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [
    isSupported,
    viewMode,
    selectedBlock,
    showAllIn3D,
    blockSummaries,
    districtStats.totalOverdue,
    handleFocusBlock,
    autoRotate,
  ]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        background: "linear-gradient(145deg, #0b1120 0%, #060913 100%)",
        border: "1px solid #1e293b",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.6)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ======================================================== */}
      {/* 1. TOP COMMAND BAR: Telemetry Title & Mode Switcher */}
      {/* ======================================================== */}
      <div
        style={{
          padding: "16px 20px",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Left: District Title & Live Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 15px rgba(124, 58, 237, 0.4)",
              flexShrink: 0,
            }}
          >
            <Compass size={22} color="white" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#f8fafc",
                  margin: 0,
                  letterSpacing: "-0.2px",
                }}
              >
                District 606 Health Facilities Spatial Command
              </h3>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background:
                    districtStats.totalOverdue > 0
                      ? "rgba(239, 68, 68, 0.18)"
                      : "rgba(16, 185, 129, 0.18)",
                  border: `1px solid ${
                    districtStats.totalOverdue > 0
                      ? "rgba(239, 68, 68, 0.4)"
                      : "rgba(16, 185, 129, 0.4)"
                  }`,
                  color: districtStats.totalOverdue > 0 ? "#f87171" : "#34d399",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: districtStats.totalOverdue > 0 ? "#ef4444" : "#10b981",
                    boxShadow:
                      districtStats.totalOverdue > 0 ? "0 0 6px #ef4444" : "0 0 6px #10b981",
                  }}
                />
                {districtStats.totalOverdue > 0
                  ? `${districtStats.totalOverdue} SLA BREACHES`
                  : "ALL ON TRACK"}
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
              Madhubani District • 21 Administrative Blocks • Real-time 7-Day Statutory SLA Tracking
            </p>
          </div>
        </div>

        {/* Center: View Switcher Lenses */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(2, 6, 23, 0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}
        >
          <button
            onClick={() => setViewMode("3d")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              background: viewMode === "3d" ? "#7c3aed" : "transparent",
              color: viewMode === "3d" ? "white" : "#94a3b8",
              boxShadow: viewMode === "3d" ? "0 2px 8px rgba(124, 58, 237, 0.4)" : "none",
            }}
          >
            <Compass size={15} />
            3D Spatial Orbit
          </button>

          <button
            onClick={() => setViewMode("heatmap")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              background: viewMode === "heatmap" ? "#7c3aed" : "transparent",
              color: viewMode === "heatmap" ? "white" : "#94a3b8",
              boxShadow: viewMode === "heatmap" ? "0 2px 8px rgba(124, 58, 237, 0.4)" : "none",
            }}
          >
            <Grid size={15} />
            606 Panoramic Matrix
          </button>

          <button
            onClick={() => setViewMode("radar")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              background: viewMode === "radar" ? "#7c3aed" : "transparent",
              color: viewMode === "radar" ? "white" : "#94a3b8",
              boxShadow: viewMode === "radar" ? "0 2px 8px rgba(124, 58, 237, 0.4)" : "none",
            }}
          >
            <ShieldAlert size={15} />
            Critical SLA Radar
            {districtStats.totalOverdue > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 10,
                }}
              >
                {districtStats.totalOverdue}
              </span>
            )}
          </button>
        </div>

        {/* Right: Quick District Reset & 3D Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {viewMode === "3d" && (
            <>
              <button
                onClick={() => setAutoRotate((prev) => !prev)}
                title={autoRotate ? "Pause auto-orbit" : "Resume auto-orbit"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 12px",
                  background: autoRotate ? "rgba(124, 58, 237, 0.2)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${
                    autoRotate ? "rgba(124, 58, 237, 0.4)" : "rgba(255,255,255,0.1)"
                  }`,
                  borderRadius: 8,
                  color: autoRotate ? "#c084fc" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={13} />
                {autoRotate ? "Orbiting" : "Orbit Paused"}
              </button>

              <button
                onClick={() => setShowAllIn3D((prev) => !prev)}
                style={{
                  padding: "7px 12px",
                  background: showAllIn3D ? "#2563eb" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {showAllIn3D ? "Showing All 606" : "Expand All 606"}
              </button>
            </>
          )}

          <button
            onClick={handleReset}
            title="Reset Filters and View"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#94a3b8",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SECONDARY FILTER & SEARCH HUD BAR */}
      {/* ======================================================== */}
      <div
        style={{
          padding: "10px 20px",
          background: "rgba(15, 23, 42, 0.4)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Left: Administrative Block Dropdown Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={15} color="#8b5cf6" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>Block:</span>
            <select
              value={selectedBlock}
              onChange={(e) => handleFocusBlock(e.target.value)}
              style={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                padding: "6px 10px",
                color: "#f8fafc",
                fontSize: 12.5,
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All 21 Blocks (District Entirety)</option>
              {BLOCK_NAMES.map((b) => {
                const s = blockSummaries[b];
                const badge = s?.overdue > 0 ? `🚨 ${b} (${s.overdue} overdue)` : `${b} (${s?.total || 0})`;
                return (
                  <option key={b} value={b}>
                    {badge}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Filter Pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: `All 606` },
              {
                id: "OVERDUE",
                label: `🚨 Overdue (${districtStats.overdueFacilitiesCount})`,
                alert: districtStats.overdueFacilitiesCount > 0,
              },
              { id: "PENDING", label: `⏳ Active Queue (${districtStats.activeFacilitiesCount})` },
              { id: "COMPLIANT", label: `✅ Compliant` },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                style={{
                  padding: "5px 11px",
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  border:
                    statusFilter === btn.id
                      ? btn.id === "OVERDUE"
                        ? "1px solid #ef4444"
                        : "1px solid #7c3aed"
                      : "1px solid rgba(255,255,255,0.1)",
                  background:
                    statusFilter === btn.id
                      ? btn.id === "OVERDUE"
                        ? "#dc2626"
                        : "#7c3aed"
                      : "rgba(255,255,255,0.03)",
                  color: statusFilter === btn.id ? "white" : "#94a3b8",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Instant Search Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
              }}
            />
            <input
              type="text"
              placeholder="Search 606 facilities, PIN, block..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "#020617",
                border: "1px solid #334155",
                borderRadius: 8,
                padding: "6px 12px 6px 32px",
                fontSize: 12.5,
                color: "white",
                outline: "none",
                width: 240,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 2,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
          {searchQuery && (
            <span style={{ fontSize: 11.5, color: "#a855f7", fontWeight: 700 }}>
              {filteredFacilities.length} found
            </span>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN VISUALIZATION STAGE: 3D, Heatmap, or Radar */}
      {/* ======================================================== */}
      <div style={{ position: "relative", minHeight: 460, width: "100%" }}>
        {/* MODE 1: 3D District Spatial Topology */}
        {viewMode === "3d" && (
          <div style={{ position: "relative", width: "100%", height: 480 }}>
            <div ref={mountRef} style={{ width: "100%", height: "100%", touchAction: "none" }} />

            {/* 3D Navigation Breadcrumb Overlay */}
            <div
              style={{
                position: "absolute",
                top: 14,
                left: 16,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(8px)",
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Madhubani District</span>
              <ChevronRight size={14} color="#64748b" />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: selectedBlock === "ALL" ? "#38bdf8" : "#f8fafc",
                }}
              >
                {selectedBlock === "ALL"
                  ? "All 21 Regional Block Hubs"
                  : `${selectedBlock} (${blockSummaries[selectedBlock]?.total || 0} Facilities)`}
              </span>

              {selectedBlock !== "ALL" && (
                <button
                  onClick={() => handleFocusBlock("ALL")}
                  style={{
                    marginLeft: 6,
                    padding: "3px 8px",
                    background: "#2563eb",
                    border: "none",
                    borderRadius: 6,
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ← All Blocks Orbit
                </button>
              )}
            </div>

            {/* 3D Visual Legend */}
            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: 16,
                zIndex: 10,
                display: "flex",
                gap: 12,
                background: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(8px)",
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#f1f5f9",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#ef4444",
                    boxShadow: "0 0 6px #ef4444",
                  }}
                />
                Overdue (&gt;7 Days SLA)
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#f1f5f9",
                  fontWeight: 600,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8" }} />
                Pending Verification (≤7 Days)
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#f1f5f9",
                  fontWeight: 600,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                Compliant / Processed
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 600,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#475569" }} />
                Zero Backlog
              </div>
            </div>

            {/* Instructions Hint */}
            <div
              style={{
                position: "absolute",
                bottom: 12,
                right: 16,
                zIndex: 10,
                fontSize: 11,
                color: "#94a3b8",
                background: "rgba(15, 23, 42, 0.75)",
                padding: "5px 10px",
                borderRadius: 6,
                pointerEvents: "none",
              }}
            >
              Drag to orbit • Scroll to zoom • Click Block or Facility to inspect
            </div>

            {/* 3D Hover Tooltip */}
            {hoveredNode && (
              <div
                style={{
                  position: "absolute",
                  left:
                    tooltipPos.x > 320 ? Math.max(10, tooltipPos.x - 290) : tooltipPos.x + 15,
                  top: Math.max(10, tooltipPos.y - 60),
                  pointerEvents: "none",
                  zIndex: 50,
                  background: "rgba(15, 23, 42, 0.95)",
                  backdropFilter: "blur(14px)",
                  border:
                    hoveredNode.type === "BLOCK"
                      ? hoveredNode.data.overdue > 0
                        ? "1.5px solid #ef4444"
                        : "1px solid #7c3aed"
                      : hoveredNode.data.overdueVerifier > 0
                      ? "1.5px solid #ef4444"
                      : "1px solid #38bdf8",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: "white",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.6)",
                  minWidth: 230,
                  maxWidth: 290,
                }}
              >
                {hoveredNode.type === "BLOCK" ? (
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#f8fafc",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{hoveredNode.data.name} Block</span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "#7c3aed",
                        }}
                      >
                        {hoveredNode.data.total} Facilities
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#94a3b8",
                      }}
                    >
                      <span>Overdue Breaches:</span>
                      <strong
                        style={{
                          color: hoveredNode.data.overdue > 0 ? "#f87171" : "#34d399",
                        }}
                      >
                        {hoveredNode.data.overdue > 0 ? `🚨 ${hoveredNode.data.overdue}` : "0"}
                      </strong>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#94a3b8",
                      }}
                    >
                      <span>Active Pending:</span>
                      <strong style={{ color: "#38bdf8" }}>{hoveredNode.data.pending}</strong>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#94a3b8",
                      }}
                    >
                      <span>Block SLA Compliance:</span>
                      <strong style={{ color: "#4ade80" }}>
                        {hoveredNode.data.compliantRate}%
                      </strong>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 10,
                        color: "#cbd5e1",
                        textAlign: "center",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        paddingTop: 4,
                      }}
                    >
                      Click to focus & drill into {hoveredNode.data.total} facilities
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#f8fafc",
                        lineHeight: 1.2,
                        marginBottom: 4,
                      }}
                    >
                      {hoveredNode.data.name}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: TYPE_COLORS[hoveredNode.data.type]?.color || "#64748b",
                          padding: "1px 6px",
                          borderRadius: 4,
                          color: "white",
                        }}
                      >
                        {hoveredNode.data.type}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {hoveredNode.data.block}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#94a3b8",
                      }}
                    >
                      <span>Total Applications:</span>
                      <strong style={{ color: "#f8fafc" }}>
                        {hoveredNode.data.totalReceived}
                      </strong>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#94a3b8",
                      }}
                    >
                      <span>Overdue (&gt;7d):</span>
                      <strong
                        style={{
                          color: hoveredNode.data.overdueVerifier > 0 ? "#f87171" : "#94a3b8",
                        }}
                      >
                        {hoveredNode.data.overdueVerifier > 0
                          ? `🚨 ${hoveredNode.data.overdueVerifier}`
                          : "0"}
                      </strong>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#94a3b8",
                      }}
                    >
                      <span>SLA Compliance:</span>
                      <strong
                        style={{
                          color:
                            hoveredNode.data.complianceRate >= 90 ? "#4ade80" : "#fbbf24",
                        }}
                      >
                        {hoveredNode.data.complianceRate}%
                      </strong>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 10,
                        color: "#cbd5e1",
                        textAlign: "center",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        paddingTop: 4,
                      }}
                    >
                      Click to open full telemetry inspector
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: 606 Panoramic Heatmap Matrix */}
        {viewMode === "heatmap" && (
          <div
            style={{
              padding: 20,
              maxHeight: 520,
              overflowY: "auto",
              background: "rgba(10, 15, 29, 0.95)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
                  All 606 Facilities Micro-Grid Matrix
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  Every tile represents one health facility organized by administrative block. Hover
                  for SLA telemetry.
                </p>
              </div>

              {/* Matrix Legend */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#f87171" }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: "#ef4444",
                    }}
                  />
                  🚨 Overdue (&gt;7d)
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#38bdf8" }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: "#3b82f6",
                    }}
                  />
                  ⏳ Pending (≤7d)
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#34d399" }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: "#10b981",
                    }}
                  />
                  ✅ Compliant
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#64748b" }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: "#334155",
                    }}
                  />
                  ⚪ Zero Pending
                </span>
              </div>
            </div>

            {/* Block Accordion Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 14,
              }}
            >
              {BLOCK_NAMES.filter((b) => selectedBlock === "ALL" || selectedBlock === b).map(
                (blockName) => {
                  const summary = blockSummaries[blockName];
                  const facs = summary?.facilities || [];
                  const isOverdue = summary?.overdue > 0;

                  return (
                    <div
                      key={blockName}
                      style={{
                        background: "rgba(15, 23, 42, 0.8)",
                        border: isOverdue
                          ? "1px solid rgba(239, 68, 68, 0.4)"
                          : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12,
                        padding: 14,
                        transition: "all 0.2s",
                      }}
                    >
                      {/* Block Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#f8fafc" }}>
                            {blockName}
                          </span>
                          <span
                            style={{
                              fontSize: 10.5,
                              color: "#94a3b8",
                              background: "rgba(255,255,255,0.06)",
                              padding: "1px 6px",
                              borderRadius: 10,
                            }}
                          >
                            {facs.length}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {isOverdue && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                background: "#dc2626",
                                color: "white",
                                padding: "2px 6px",
                                borderRadius: 10,
                              }}
                            >
                              🚨 {summary.overdue} OVERDUE
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: summary.compliantRate >= 90 ? "#4ade80" : "#fbbf24",
                            }}
                          >
                            {summary.compliantRate}% SLA
                          </span>
                        </div>
                      </div>

                      {/* Micro-Tiles Grid for Facilities in Block */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(20px, 1fr))",
                          gap: 4,
                        }}
                      >
                        {facs.map((fac) => {
                          let tileColor = "#334155";
                          if (fac.overdueVerifier > 0) tileColor = "#ef4444";
                          else if (fac.pendingVerifier > 0) tileColor = "#3b82f6";
                          else if (fac.totalReceived > 0) tileColor = "#10b981";

                          const isSelected = selectedFacility?.name === fac.name;

                          return (
                            <div
                              key={fac.name}
                              onClick={() => setSelectedFacility(fac)}
                              title={`${fac.name} (${fac.type}) - ${
                                fac.overdueVerifier > 0
                                  ? `${fac.overdueVerifier} Overdue`
                                  : fac.pendingVerifier > 0
                                  ? `${fac.pendingVerifier} Pending`
                                  : "Compliant"
                              }`}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                background: tileColor,
                                border: isSelected
                                  ? "2px solid #ffffff"
                                  : fac.overdueVerifier > 0
                                  ? "1px solid #f87171"
                                  : "1px solid rgba(255,255,255,0.08)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 9,
                                fontWeight: 800,
                                color: "rgba(255,255,255,0.85)",
                                transition: "transform 0.15s",
                                transform: isSelected ? "scale(1.2)" : "scale(1)",
                              }}
                            >
                              {fac.type === "DH"
                                ? "DH"
                                : fac.type === "SDH"
                                ? "SD"
                                : fac.type === "CHC"
                                ? "C"
                                : ""}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* MODE 3: Critical SLA Priority Radar */}
        {viewMode === "radar" && (
          <div
            style={{
              padding: 20,
              maxHeight: 520,
              overflowY: "auto",
              background: "rgba(10, 15, 29, 0.95)",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#f8fafc" }}>
                District SLA Priority Triage Radar
              </h4>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                Active bottlenecks and statutory verification breaches across Madhubani District.
              </p>
            </div>

            {criticalRadarFacilities.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  background: "rgba(16, 185, 129, 0.08)",
                  borderRadius: 14,
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}
              >
                <CheckCircle2 size={42} color="#10b981" style={{ margin: "0 auto 12px" }} />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#34d399" }}>
                  100% District Statutory Compliance
                </h4>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8" }}>
                  Zero health facilities currently possess verifications pending beyond the 7-day
                  statutory period.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {criticalRadarFacilities.map((fac) => {
                  const isOverdue = fac.overdueVerifier > 0;
                  return (
                    <div
                      key={fac.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 18px",
                        background: isOverdue
                          ? "rgba(239, 68, 68, 0.08)"
                          : "rgba(15, 23, 42, 0.7)",
                        border: isOverdue
                          ? "1.5px solid rgba(239, 68, 68, 0.35)"
                          : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12,
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: isOverdue ? "#dc2626" : "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: 800,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {fac.type}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>
                              {fac.name}
                            </span>
                            {isOverdue && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  background: "#ef4444",
                                  color: "white",
                                  padding: "2px 7px",
                                  borderRadius: 10,
                                }}
                              >
                                🚨 {fac.overdueVerifier} OVERDUE (&gt;7d)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                            Block: <strong style={{ color: "#cbd5e1" }}>{fac.block}</strong> •
                            Verifier: <code style={{ color: "#c084fc" }}>{fac.username}</code> •
                            PIN: {fac.pin}
                          </div>
                        </div>
                      </div>

                      {/* Right Actions & Metrics */}
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>Active Pending</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#38bdf8" }}>
                            {fac.pendingVerifier}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>SLA Rate</div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: fac.complianceRate >= 90 ? "#4ade80" : "#fbbf24",
                            }}
                          >
                            {fac.complianceRate}%
                          </div>
                        </div>

                        <button
                          onClick={() => handleAuditInDirectory(fac.name)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            background: "#7c3aed",
                            border: "none",
                            borderRadius: 8,
                            color: "white",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Eye size={13} />
                          Audit in Directory
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. FACILITY TELEMETRY INSPECTOR DRAWER / CARD */}
        {/* ======================================================== */}
        {selectedFacility && (
          <div
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              bottom: 16,
              width: 320,
              background: "rgba(15, 23, 42, 0.95)",
              backdropFilter: "blur(16px)",
              border:
                selectedFacility.overdueVerifier > 0
                  ? "1.5px solid #ef4444"
                  : "1px solid rgba(124, 58, 237, 0.4)",
              borderRadius: 14,
              padding: 18,
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.8)",
              zIndex: 60,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      background: TYPE_COLORS[selectedFacility.type]?.color || "#64748b",
                      padding: "2px 7px",
                      borderRadius: 4,
                      color: "white",
                    }}
                  >
                    {selectedFacility.type} • {TYPE_COLORS[selectedFacility.type]?.label || "Clinic"}
                  </span>
                  <h4
                    style={{
                      margin: "6px 0 2px",
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#f8fafc",
                      lineHeight: 1.25,
                    }}
                  >
                    {selectedFacility.name}
                  </h4>
                  <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                    {selectedFacility.block} Block • Postal PIN: {selectedFacility.pin}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFacility(null)}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "none",
                    borderRadius: 6,
                    color: "#94a3b8",
                    padding: 4,
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  marginBottom: 14,
                  background:
                    selectedFacility.overdueVerifier > 0
                      ? "rgba(239, 68, 68, 0.15)"
                      : selectedFacility.pendingVerifier > 0
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(16, 185, 129, 0.15)",
                  border: `1px solid ${
                    selectedFacility.overdueVerifier > 0
                      ? "rgba(239, 68, 68, 0.4)"
                      : selectedFacility.pendingVerifier > 0
                      ? "rgba(59, 130, 246, 0.4)"
                      : "rgba(16, 185, 129, 0.4)"
                  }`,
                }}
              >
                <div
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color:
                      selectedFacility.overdueVerifier > 0
                        ? "#f87171"
                        : selectedFacility.pendingVerifier > 0
                        ? "#60a5fa"
                        : "#34d399",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {selectedFacility.overdueVerifier > 0 ? (
                    <>
                      <AlertTriangle size={14} /> 🚨 {selectedFacility.overdueVerifier} Overdue
                      Applications
                    </>
                  ) : selectedFacility.pendingVerifier > 0 ? (
                    <>
                      <Clock size={14} /> ⏳ {selectedFacility.pendingVerifier} Pending within 7-Day SLA
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> ✅ 100% Statutory SLA Compliant
                    </>
                  )}
                </div>
              </div>

              {/* Detailed Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Total Received</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                    {selectedFacility.totalReceived}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Verified Done</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#34d399" }}>
                    {selectedFacility.verifiedCount}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Pending (≤7d)</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#38bdf8" }}>
                    {selectedFacility.onTrackVerifier}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>SLA Rate</div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: selectedFacility.complianceRate >= 90 ? "#4ade80" : "#fbbf24",
                    }}
                  >
                    {selectedFacility.complianceRate}%
                  </div>
                </div>
              </div>

              {/* Verifier Credentials info */}
              <div
                style={{
                  background: "rgba(2, 6, 23, 0.5)",
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 11.5,
                  color: "#94a3b8",
                }}
              >
                <div>
                  Verifier Login: <code style={{ color: "#c084fc" }}>{selectedFacility.username}</code>
                </div>
                <div style={{ marginTop: 3 }}>
                  Turnaround Avg:{" "}
                  <strong style={{ color: "#cbd5e1" }}>
                    {selectedFacility.avgTurnaroundDays} days
                  </strong>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              <button
                onClick={() => handleAuditInDirectory(selectedFacility.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 14px",
                  background: "#7c3aed",
                  border: "none",
                  borderRadius: 8,
                  color: "white",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <ExternalLink size={14} />
                Audit in Full Compliance Directory
              </button>

              {viewMode !== "3d" && (
                <button
                  onClick={() => {
                    setViewMode("3d");
                    handleFocusBlock(selectedFacility.block);
                  }}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#cbd5e1",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Locate in 3D Topology Orbit
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. BOTTOM TELEMETRY TICKER: 606 Facilities Snapshot */}
      {/* ======================================================== */}
      <div
        style={{
          padding: "12px 20px",
          background: "rgba(2, 6, 23, 0.85)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Monitored Facilities: </span>
            <strong style={{ fontSize: 13, color: "#f8fafc" }}>
              {districtStats.totalFacilities} (100% District Coverage)
            </strong>
          </div>

          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />

          <div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Administrative Blocks: </span>
            <strong style={{ fontSize: 13, color: "#c084fc" }}>21 Blocks</strong>
          </div>

          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />

          <div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Statutory Overdue: </span>
            <strong
              style={{
                fontSize: 13,
                color: districtStats.totalOverdue > 0 ? "#f87171" : "#34d399",
              }}
            >
              {districtStats.totalOverdue > 0 ? `${districtStats.totalOverdue} Applications` : "0"}
            </strong>
          </div>

          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />

          <div>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Overall SLA Compliance: </span>
            <strong style={{ fontSize: 13, color: "#4ade80" }}>
              {districtStats.complianceRate}%
            </strong>
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: "#64748b" }}>
          Govt. of Bihar • Madhubani Birth Registration Command
        </div>
      </div>
    </div>
  );
}
