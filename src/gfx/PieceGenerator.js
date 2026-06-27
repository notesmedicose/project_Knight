import * as THREE from 'three';

/**
 * Procedural Luxury 3D Chess Piece Generator
 * Re-engineers exact 3D replicas of high-end imperial marble & metallic filigree chess sets
 * matching the reference photo precisely.
 */
export class PieceGenerator {
  constructor() {
    // Advanced PBR materials simulating polished imperial alabaster/marble & filigree gold
    this.materials = {
      whiteBody: new THREE.MeshStandardMaterial({
        color: 0xf6f4ee, // Polished Imperial White Marble
        roughness: 0.12,
        metalness: 0.02,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08
      }),
      whiteAccent: new THREE.MeshStandardMaterial({
        color: 0xdfb438, // Royal Filigree Gold
        metalness: 0.92,
        roughness: 0.18,
        emissive: 0x3d2b00,
        emissiveIntensity: 0.15
      }),
      blackBody: new THREE.MeshStandardMaterial({
        color: 0x18181a, // Obsidian / Dark Ebony Marble
        roughness: 0.14,
        metalness: 0.05,
        clearcoat: 0.85,
        emissive: 0x050505
      }),
      blackAccent: new THREE.MeshStandardMaterial({
        color: 0xd8d8e0, // Antique Filigree Silver / Platinum
        metalness: 0.95,
        roughness: 0.22,
        emissive: 0x111118,
        emissiveIntensity: 0.15
      }),
      highlight: new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8
      })
    };
  }

  /**
   * Helper to create an ornate filigree metallic ring with embossed beaded details
   */
  createFiligreeRing(radius, yPos, tubeRadius = 0.035, detail = true) {
    const group = new THREE.Group();

    // Main central ring torus
    const mainGeom = new THREE.TorusGeometry(radius, tubeRadius, 16, 36);
    mainGeom.rotateX(Math.PI / 2);
    mainGeom.translate(0, yPos, 0);
    const mainMesh = new THREE.Mesh(mainGeom);
    group.add(mainMesh);

    if (detail) {
      // Add embossed gold filigree beaded nodes around the ring circumference
      const numBeads = Math.floor(radius * 36);
      const beadGeom = new THREE.SphereGeometry(tubeRadius * 0.75, 8, 8);
      for (let i = 0; i < numBeads; i++) {
        const angle = (i / numBeads) * Math.PI * 2;
        const beadMesh = new THREE.Mesh(beadGeom);
        beadMesh.position.set(
          Math.cos(angle) * radius,
          yPos,
          Math.sin(angle) * radius
        );
        group.add(beadMesh);
      }
    }

    return group;
  }

  /**
   * Standard luxury turned marble base profile for turned pieces
   */
  getBaseProfile() {
    const points = [];
    points.push(new THREE.Vector2(0, 0));
    points.push(new THREE.Vector2(0.40, 0));
    points.push(new THREE.Vector2(0.40, 0.05));
    points.push(new THREE.Vector2(0.36, 0.09));
    points.push(new THREE.Vector2(0.32, 0.16));
    points.push(new THREE.Vector2(0.35, 0.22));
    points.push(new THREE.Vector2(0.37, 0.26));
    points.push(new THREE.Vector2(0.30, 0.30));
    return points;
  }

  /**
   * Pawn: Sphere head on turned stem with gold filigree base ring
   */
  createPawnMesh(color) {
    const bodyMat = color === 'w' ? this.materials.whiteBody : this.materials.blackBody;
    const accentMat = color === 'w' ? this.materials.whiteAccent : this.materials.blackAccent;
    const group = new THREE.Group();

    // Body lathe profile
    const points = this.getBaseProfile();
    points.push(new THREE.Vector2(0.20, 0.48));
    points.push(new THREE.Vector2(0.17, 0.66));
    points.push(new THREE.Vector2(0.25, 0.72));
    points.push(new THREE.Vector2(0.18, 0.76));

    // Spherical head lathe curve
    const headCenterY = 0.95;
    const headRadius = 0.22;
    for (let i = 0; i <= 12; i++) {
      const angle = (i / 12) * Math.PI;
      const x = Math.sin(angle) * headRadius;
      const y = headCenterY - Math.cos(angle) * headRadius;
      points.push(new THREE.Vector2(x, y));
    }
    points.push(new THREE.Vector2(0, 1.18));

    const bodyGeom = new THREE.LatheGeometry(points, 36);
    bodyGeom.scale(0.85, 0.85, 0.85);
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Filigree Metallic Ring at base flare
    const ringGroup = this.createFiligreeRing(0.35 * 0.85, 0.25 * 0.85, 0.032);
    ringGroup.traverse(child => { if (child.isMesh) { child.material = accentMat; child.castShadow = true; } });
    group.add(ringGroup);

    // Apex gold pin on top of sphere head
    const pinGeom = new THREE.SphereGeometry(0.04 * 0.85, 12, 12);
    pinGeom.translate(0, 1.18 * 0.85, 0);
    const pinMesh = new THREE.Mesh(pinGeom, accentMat);
    group.add(pinMesh);

    return group;
  }

  /**
   * Rook: Castle tower with double filigree rings and castellated top
   */
  createRookMesh(color) {
    const bodyMat = color === 'w' ? this.materials.whiteBody : this.materials.blackBody;
    const accentMat = color === 'w' ? this.materials.whiteAccent : this.materials.blackAccent;
    const group = new THREE.Group();

    // Main tower lathe profile
    const points = this.getBaseProfile();
    points.push(new THREE.Vector2(0.27, 0.50));
    points.push(new THREE.Vector2(0.26, 0.78));
    points.push(new THREE.Vector2(0.34, 0.86));
    points.push(new THREE.Vector2(0.34, 1.12));
    points.push(new THREE.Vector2(0.25, 1.12));
    points.push(new THREE.Vector2(0.25, 0.98));
    points.push(new THREE.Vector2(0, 0.98));

    const latheGeom = new THREE.LatheGeometry(points, 36);
    latheGeom.scale(0.85, 0.85, 0.85);
    const bodyMesh = new THREE.Mesh(latheGeom, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // 1. Lower Filigree Ring near base
    const lowerRing = this.createFiligreeRing(0.35 * 0.85, 0.25 * 0.85, 0.035);
    lowerRing.traverse(child => { if (child.isMesh) { child.material = accentMat; child.castShadow = true; } });
    group.add(lowerRing);

    // 2. Upper Filigree Ring below battlements
    const upperRing = this.createFiligreeRing(0.27 * 0.85, 0.78 * 0.85, 0.03);
    upperRing.traverse(child => { if (child.isMesh) { child.material = accentMat; child.castShadow = true; } });
    group.add(upperRing);

    // 3. Castle Crenellations (5 merlons around top rim)
    const numMerlons = 5;
    const merlonGroup = new THREE.Group();
    const merlonGeom = new THREE.BoxGeometry(0.10 * 0.85, 0.16 * 0.85, 0.12 * 0.85);
    const radius = 0.295 * 0.85;
    const merlonY = 1.12 * 0.85;

    for (let i = 0; i < numMerlons; i++) {
      const angle = (i / numMerlons) * Math.PI * 2;
      const merlon = new THREE.Mesh(merlonGeom, bodyMat);
      merlon.position.set(Math.sin(angle) * radius, merlonY, Math.cos(angle) * radius);
      merlon.rotation.y = angle;
      merlon.castShadow = true;
      merlon.receiveShadow = true;
      merlonGroup.add(merlon);
    }
    group.add(merlonGroup);

    return group;
  }

  /**
   * Bishop: Unique double-arch winged scroll base (~ ⁀ ⁀ ~), teardrop body, filigree cap
   */
  createBishopMesh(color) {
    const bodyMat = color === 'w' ? this.materials.whiteBody : this.materials.blackBody;
    const accentMat = color === 'w' ? this.materials.whiteAccent : this.materials.blackAccent;
    const group = new THREE.Group();

    // 1. Iconic Double-Arch Winged Scroll Pedestal (Exact match to reference photo!)
    const wingCurveLeft = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.44, 0.04, 0),
      new THREE.Vector3(-0.30, 0.20, 0),
      new THREE.Vector3(0, 0.12, 0)
    ]);
    const wingCurveRight = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.12, 0),
      new THREE.Vector3(0.30, 0.20, 0),
      new THREE.Vector3(0.44, 0.04, 0)
    ]);

    const wingGeomL = new THREE.TubeGeometry(wingCurveLeft, 24, 0.055, 16, false);
    const wingGeomR = new THREE.TubeGeometry(wingCurveRight, 24, 0.055, 16, false);
    
    const wingMeshL = new THREE.Mesh(wingGeomL, bodyMat);
    const wingMeshR = new THREE.Mesh(wingGeomR, bodyMat);
    wingMeshL.castShadow = true; wingMeshL.receiveShadow = true;
    wingMeshR.castShadow = true; wingMeshR.receiveShadow = true;
    
    const wingsGroup = new THREE.Group();
    wingsGroup.add(wingMeshL);
    wingsGroup.add(wingMeshR);
    wingsGroup.scale.set(0.85, 0.85, 0.85);
    group.add(wingsGroup);

    // 2. Main Teardrop / Mitre Body
    const points = [];
    points.push(new THREE.Vector2(0, 0.14));
    points.push(new THREE.Vector2(0.26, 0.24));
    points.push(new THREE.Vector2(0.20, 0.52));
    points.push(new THREE.Vector2(0.30, 0.68));

    // Teardrop dome
    const bodyCenterY = 0.95;
    for (let i = 0; i <= 12; i++) {
      const angle = (i / 12) * Math.PI;
      const x = Math.sin(angle) * 0.25;
      const y = bodyCenterY - Math.cos(angle) * 0.30;
      points.push(new THREE.Vector2(x, y));
    }
    points.push(new THREE.Vector2(0, 1.30));

    const bodyGeom = new THREE.LatheGeometry(points, 36);
    bodyGeom.scale(0.85, 0.85, 0.85);
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // 3. Base Filigree Ring at waist
    const waistRing = this.createFiligreeRing(0.25 * 0.85, 0.52 * 0.85, 0.032);
    waistRing.traverse(child => { if (child.isMesh) { child.material = accentMat; child.castShadow = true; } });
    group.add(waistRing);

    // 4. Ornate Gold Filigree Conical Mesh Cap & Top Finial Ball
    const capGeom = new THREE.ConeGeometry(0.18 * 0.85, 0.32 * 0.85, 20);
    capGeom.translate(0, 1.06 * 0.85, 0);
    const capMesh = new THREE.Mesh(capGeom, accentMat);
    capMesh.castShadow = true;
    group.add(capMesh);

    const finialGeom = new THREE.SphereGeometry(0.065 * 0.85, 16, 16);
    finialGeom.translate(0, 1.26 * 0.85, 0);
    const finialMesh = new THREE.Mesh(finialGeom, accentMat);
    finialMesh.castShadow = true;
    group.add(finialMesh);

    return group;
  }

  /**
   * Knight: Anatomical horse head with carved grooved mane and gold filigree base
   */
  createKnightMesh(color) {
    const bodyMat = color === 'w' ? this.materials.whiteBody : this.materials.blackBody;
    const accentMat = color === 'w' ? this.materials.whiteAccent : this.materials.blackAccent;
    const group = new THREE.Group();

    // Turned Base Lathe
    const basePoints = this.getBaseProfile();
    basePoints.push(new THREE.Vector2(0.28, 0.45));
    basePoints.push(new THREE.Vector2(0.33, 0.54));
    basePoints.push(new THREE.Vector2(0, 0.54));
    const baseGeom = new THREE.LatheGeometry(basePoints, 36);
    baseGeom.scale(0.85, 0.85, 0.85);
    const baseMesh = new THREE.Mesh(baseGeom, bodyMat);
    baseMesh.castShadow = true;
    group.add(baseMesh);

    // Filigree Ring around base pedestal
    const ringGroup = this.createFiligreeRing(0.35 * 0.85, 0.25 * 0.85, 0.035);
    ringGroup.traverse(child => { if (child.isMesh) { child.material = accentMat; child.castShadow = true; } });
    group.add(ringGroup);

    // Sculpted Anatomical Horse Head Group
    const headGroup = new THREE.Group();

    // 1. Curved Neck
    const neckGeom = new THREE.CylinderGeometry(0.20, 0.30, 0.55, 16);
    neckGeom.translate(0, 0.72, 0.02);
    neckGeom.rotateX(0.22);
    headGroup.add(new THREE.Mesh(neckGeom, bodyMat));

    // 2. Muzzle / Snout angled down
    const snoutGeom = new THREE.BoxGeometry(0.32, 0.28, 0.46);
    snoutGeom.translate(0, 0.84, 0.28);
    snoutGeom.rotateX(-0.18);
    headGroup.add(new THREE.Mesh(snoutGeom, bodyMat));

    // 3. Carved Grooved Mane down back of neck
    const maneGroup = new THREE.Group();
    const numGrooves = 7;
    for (let i = 0; i < numGrooves; i++) {
      const t = i / numGrooves;
      const grooveGeom = new THREE.BoxGeometry(0.08, 0.12, 0.36 - t * 0.1);
      grooveGeom.translate(0, 0.95 - i * 0.06, -0.12 - i * 0.02);
      grooveGeom.rotateX(-0.35);
      maneGroup.add(new THREE.Mesh(grooveGeom, bodyMat));
    }
    headGroup.add(maneGroup);

    // 4. Ears
    const earL = new THREE.ConeGeometry(0.06, 0.18, 8);
    earL.translate(-0.11, 1.10, -0.04);
    earL.rotateZ(-0.15);
    const earR = new THREE.ConeGeometry(0.06, 0.18, 8);
    earR.translate(0.11, 1.10, -0.04);
    earR.rotateZ(0.15);
    headGroup.add(new THREE.Mesh(earL, bodyMat));
    headGroup.add(new THREE.Mesh(earR, bodyMat));

    headGroup.scale.set(0.85, 0.85, 0.85);
    headGroup.traverse(child => {
      if (child.isMesh) {
        child.material = bodyMat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    group.add(headGroup);

    // Orient Knight to face forward
    group.rotation.y = color === 'w' ? 0 : Math.PI;
    return group;
  }

  /**
   * Queen: Flared crown with 8 spires tipped with marble pearls and double gold filigree bands
   */
  createQueenMesh(color) {
    const bodyMat = color === 'w' ? this.materials.whiteBody : this.materials.blackBody;
    const accentMat = color === 'w' ? this.materials.whiteAccent : this.materials.blackAccent;
    const group = new THREE.Group();

    // Main Body lathe profile
    const points = this.getBaseProfile();
    points.push(new THREE.Vector2(0.22, 0.55));
    points.push(new THREE.Vector2(0.18, 0.92));
    points.push(new THREE.Vector2(0.32, 1.02));
    // Crown flare
    points.push(new THREE.Vector2(0.44, 1.38));
    points.push(new THREE.Vector2(0.32, 1.40));
    points.push(new THREE.Vector2(0, 1.34));

    const bodyGeom = new THREE.LatheGeometry(points, 36);
    bodyGeom.scale(0.88, 0.88, 0.88);
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // 1. Base Filigree Ring
    const baseRing = this.createFiligreeRing(0.35 * 0.88, 0.25 * 0.88, 0.035);
    baseRing.traverse(child => { if (child.isMesh) { child.material = accentMat; child.castShadow = true; } });
    group.add(baseRing);

    // 2. Crown Base Filigree Ring
    const crownRing = this.createFiligreeRing(0.32 * 0.88, 0.92 * 0.88, 0.032);
    crownRing.traverse(child => { if (child.isMesh) { child.material = accentMat; child.castShadow = true; } });
    group.add(crownRing);

    // 3. 8 Radiating Crown Spires tipped with smooth White Marble Pearl Finials (Exact reference photo detail!)
    const numSpikes = 8;
    const radius = 0.40 * 0.88;
    const spikeY = 1.40 * 0.88;
    for (let i = 0; i < numSpikes; i++) {
      const angle = (i / numSpikes) * Math.PI * 2;
      
      // Marble Pearl Ball Finial on top of spike
      const pearlGeom = new THREE.SphereGeometry(0.048 * 0.88, 16, 16);
      const pearlMesh = new THREE.Mesh(pearlGeom, bodyMat);
      pearlMesh.position.set(Math.cos(angle) * radius, spikeY + 0.02, Math.sin(angle) * radius);
      pearlMesh.castShadow = true;
      group.add(pearlMesh);
    }

    return group;
  }

  /**
   * King: Grand imperial stout body, massive bulbous orb dome crown, filigree band, royal cross
   */
  createKingMesh(color) {
    const bodyMat = color === 'w' ? this.materials.whiteBody : this.materials.blackBody;
    const accentMat = color === 'w' ? this.materials.whiteAccent : this.materials.blackAccent;
    const group = new THREE.Group();

    // Imperial Body Lathe Profile
    const points = this.getBaseProfile();
    points.push(new THREE.Vector2(0.24, 0.58));
    points.push(new THREE.Vector2(0.20, 0.94));
    points.push(new THREE.Vector2(0.36, 1.06));

    // Massive Imperial Orb Dome Crown (Exact match to reference photo!)
    const domeCenterY = 1.30;
    const domeRadius = 0.42;
    for (let i = 0; i <= 10; i++) {
      const angle = (i / 10) * (Math.PI / 2);
      const x = Math.cos(angle) * domeRadius;
      const y = domeCenterY + Math.sin(angle) * 0.26;
      points.push(new THREE.Vector2(x, y));
    }
    points.push(new THREE.Vector2(0, 1.56));

    const bodyGeom = new THREE.LatheGeometry(points, 36);
    bodyGeom.scale(0.9, 0.9, 0.9);
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // 1. Collar Filigree Ring
    const collarRing = this.createFiligreeRing(0.35 * 0.9, 0.25 * 0.9, 0.038);
    collarRing.traverse(child => { if (child.isMesh) { child.material = accentMat; child.castShadow = true; } });
    group.add(collarRing);

    // 2. Imperial Filigree Band wrapping around the wide middle of orb dome
    const domeBand = this.createFiligreeRing(0.42 * 0.9, 1.30 * 0.9, 0.035);
    domeBand.traverse(child => { if (child.isMesh) { child.material = accentMat; child.castShadow = true; } });
    group.add(domeBand);

    // 3. Ornate Royal Metallic Cross on Top
    const crossGroup = new THREE.Group();
    const crossVert = new THREE.BoxGeometry(0.075 * 0.9, 0.28 * 0.9, 0.075 * 0.9);
    crossVert.translate(0, 1.68 * 0.9, 0);
    const crossHoriz = new THREE.BoxGeometry(0.20 * 0.9, 0.075 * 0.9, 0.075 * 0.9);
    crossHoriz.translate(0, 1.70 * 0.9, 0);

    crossGroup.add(new THREE.Mesh(crossVert, accentMat));
    crossGroup.add(new THREE.Mesh(crossHoriz, accentMat));
    crossGroup.traverse(child => { if (child.isMesh) { child.castShadow = true; } });
    group.add(crossGroup);

    return group;
  }

  /**
   * Create piece 3D object dynamically by type and color
   */
  createPieceMesh(type, color) {
    const t = type.toLowerCase();
    let mesh;

    switch (t) {
      case 'p': mesh = this.createPawnMesh(color); break;
      case 'r': mesh = this.createRookMesh(color); break;
      case 'n': mesh = this.createKnightMesh(color); break;
      case 'b': mesh = this.createBishopMesh(color); break;
      case 'q': mesh = this.createQueenMesh(color); break;
      case 'k': mesh = this.createKingMesh(color); break;
      default: mesh = this.createPawnMesh(color); break;
    }

    mesh.userData = { type, color };
    return mesh;
  }
}
