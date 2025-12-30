import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();

const pillarModel = await loader.loadAsync('assets/pillar/pillar.glb');
const pillarRingModel = await loader.loadAsync('assets/pillar/ring.glb');
pillarModel.scene.scale.set(1.2, 5, 1.2);
pillarRingModel.scene.scale.setScalar(1.2);

const birdModel = await loader.loadAsync('assets/bird/bird.glb');
birdModel.scene.rotation.y = -Math.PI / 2;
birdModel.scene.scale.setScalar(0.65);
birdModel.scene.position.z = -1;

const minView = -Math.PI / 4;
const maxView = Math.PI / 4;
const viewSpeed = 0.002; // radians
let yaw = 0;
let pitch = 0;
camera.rotation.order = 'YXZ';

const PILLAR_DIMENSIONS = { width: 5, height: 100, depth: 5 };
const PILLAR_SPEED = 0.2;
const PILLAR_GAP_SIZE = 116;
const PILLAR_GAP_POSITION = 28;
const pillarGeometry = new THREE.BoxGeometry(PILLAR_DIMENSIONS.width, PILLAR_DIMENSIONS.height, PILLAR_DIMENSIONS.depth);

const pillars = [];
const totalPillars = 10;
const lastPositionZ = -(totalPillars * 20);

const PLAYER_DIMENSIONS = { width: 2.1, height: 2.1, depth: 3.5 };
const PLAYER_SPEED = 0.3;
const playerGeometry = new THREE.BoxGeometry(PLAYER_DIMENSIONS.width, PLAYER_DIMENSIONS.height, PLAYER_DIMENSIONS.depth);

let player = null;

let twoDimensional = false;
let started = false;

class Pillar {
    constructor(id) {
        this.id = id;
        this.material = new THREE.MeshStandardMaterial({ visible: false });
        this.top = new THREE.Mesh(pillarGeometry, this.material);
        this.bottom = new THREE.Mesh(pillarGeometry, this.material);
        this.canMove = false;
        this.resetPosition(-(id * 20 + 20));
        this.setRandomGapPosition(PILLAR_GAP_POSITION / 2);
        this.setPillarTextures();
    }

    move() {
        this.z += PILLAR_SPEED;
        this.top.position.z = this.z;
        this.bottom.position.z = this.z;
    }

    resetPosition(z) {
        this.top.position.z = z;
        this.bottom.position.z = z;
        this.z = z;
    }

    setRandomGapPosition(position) {
        // Random even whole number between 0 and given gap position
        this.randomGapPosition = position || Math.floor(Math.random() * (PILLAR_GAP_POSITION / 2 + 1)) * 2;
        this.top.position.y = (PILLAR_GAP_SIZE / 2) + PILLAR_GAP_POSITION / 2 - this.randomGapPosition;
        this.bottom.position.y = -(PILLAR_GAP_SIZE / 2) + PILLAR_GAP_POSITION / 2 - this.randomGapPosition;
    }

    setPillarTextures() {
        const topPillarPart = clone(pillarModel.scene);
        const topPillarRing = clone(pillarRingModel.scene);
        topPillarPart.position.y = -49;
        topPillarRing.position.y = -62;
        this.top.add(topPillarPart);
        this.top.add(topPillarRing);

        const bottomPillarPart = clone(pillarModel.scene);
        const bottomPillarRing = clone(pillarRingModel.scene);
        bottomPillarPart.position.y = -1;
        bottomPillarRing.position.y = 35.3;
        this.bottom.add(bottomPillarPart);
        this.bottom.add(bottomPillarRing);
    }
}

class Player {
    constructor() {
        this.material = new THREE.MeshStandardMaterial({ visible: false });
        this.mesh = new THREE.Mesh(playerGeometry, this.material);
        this.mesh.add(birdModel.scene);
        this.canMove = false;
    }

    resetPosition() {
        camera.position.y = 1;
        player.mesh.position.y = 0;
    }

    moveUp() {
        if (this.mesh.position.y > 23) return;
        if (!twoDimensional) camera.position.y += PLAYER_SPEED;
        player.mesh.position.y += PLAYER_SPEED;
    }

    moveDown() {
        if (this.mesh.position.y < -23) return;
        if (!twoDimensional) camera.position.y -= PLAYER_SPEED;
        player.mesh.position.y -= PLAYER_SPEED;
    }
}

init();
function init() {
    // Required to see metallic textures
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(environment).texture;
    scene.environmentIntensity = 0.6;
    scene.background = new THREE.Color('lightblue');
    
    player = new Player();
    scene.add(player.mesh);

    for (let i = 0; i < totalPillars; i++) {
        pillars[i] = new Pillar(i);
    }

    for (const pillar of pillars) {
        scene.add(pillar.top);
        scene.add(pillar.bottom);
    }

    // Top and bottom surface
    const surfaceGeometry = new THREE.BoxGeometry(500, 1, 500);
    const surfaceMaterial = new THREE.MeshStandardMaterial({ color: 'green' });

    const surfaceTop = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    surfaceTop.position.y = 60;
    scene.add(surfaceTop);

    const surfaceBottom = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    surfaceBottom.position.y = -60;
    scene.add(surfaceBottom);

    // Camera perspective from front of the bird
    camera.position.set(0, 1, -2.8);
}

function animate() {
    renderer.render(scene, camera);
    if (!started) return;
    if (player.canMove) {
        if (keyPressed) player.moveUp();
        else player.moveDown();
    }

    for (const pillar of pillars) {
        if (pillar.canMove) pillar.move();

        // Collision detection
        if ((pillar.top.position.y - PILLAR_DIMENSIONS.height / 2 <= player.mesh.position.y + PLAYER_DIMENSIONS.height / 2 ||
            pillar.bottom.position.y + PILLAR_DIMENSIONS.height / 2 >= player.mesh.position.y - PLAYER_DIMENSIONS.height / 2) &&
            pillar.z + PILLAR_DIMENSIONS.depth / 2 >= player.mesh.position.z - PLAYER_DIMENSIONS.depth / 2 &&
            pillar.z - PILLAR_DIMENSIONS.depth / 2 <= player.mesh.position.z + PLAYER_DIMENSIONS.depth / 2) {
            stopGame();
            break;
        }

        // Pillar leaves the 2D camera
        if (pillar.z >= 60) {
            pillar.resetPosition(lastPositionZ + 60);
            pillar.setRandomGapPosition();
        }
    }
}

let keyPressed = false;
function onKeyDown(key) {
    if (key.code === 'Space') keyPressed = true;
    // Change camera perspective
    else if (key.code === 'KeyP') {
        if (twoDimensional) {
            camera.rotation.y = 0;
            camera.position.set(0, player.mesh.position.y + 1, -2.8);
        }
        else {
            camera.rotation.set(0, Math.PI / 2, 0);
            camera.position.set(40, 0, -20);
        }
        twoDimensional = !twoDimensional;
    }
}

function onKeyUp(key) {
    if (key.code === 'Space') keyPressed = false;
}

// Start the game with a click
function onClick() {
    if (started) return;
    document.body.requestPointerLock();
    player.canMove = true;
    player.resetPosition();
    for (let i = 0; i < totalPillars; i++) {
        pillars[i].resetPosition(-(i * 20 + 20));
        pillars[i].setRandomGapPosition(!i ? PILLAR_GAP_POSITION / 2 : false);
        pillars[i].canMove = true;
    }
    started = true;
}

function stopGame() {
    if (!started) return;
    document.exitPointerLock();
    player.canMove = false;
    for (const pillar of pillars) {
        pillar.canMove = false;
    }
    started = false;
}

// Looking around in first person
function onMouseMove(event) {
    if (!document.pointerLockElement || twoDimensional) return;

    yaw -= event.movementX * viewSpeed;
    pitch -= event.movementY * viewSpeed;

    yaw = THREE.MathUtils.clamp(yaw, minView, maxView);
    pitch = THREE.MathUtils.clamp(pitch, minView, maxView);

    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

function onWindowResize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    renderer.setSize(newWidth, newHeight);

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
}

document.addEventListener('click', onClick);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
window.addEventListener('resize', onWindowResize);

renderer.setAnimationLoop(animate);