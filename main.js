import * as THREE from 'three';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const minYaw = -Math.PI / 4;
const maxYaw = Math.PI / 4;
const rotationSpeed = 0.002; // radians
let yaw = 0;
let pitch = 0;
camera.rotation.order = 'YXZ';

const pillarWidth = 5;
const pillarHeight = 100;
const pillarDepth = 5;

const lastPositionZ = -100;

const pillars = [];
const totalPillars = 5;

const colors = ['blue', 'yellow', 'red', 'green', 'pink'];

const pillarGeometry = new THREE.BoxGeometry(pillarWidth, pillarHeight, pillarDepth);

const playerGeometry = new THREE.BoxGeometry(3, 3, 3);
let player = null;

class Pillar {
    constructor(id, positionZ) {
        this.id = id;
        this.material = new THREE.MeshPhongMaterial({ color: colors[id] });
        this.top = new THREE.Mesh(pillarGeometry, this.material);
        this.bottom = new THREE.Mesh(pillarGeometry, this.material);
        this.top.position.z = positionZ;
        this.bottom.position.z = positionZ;
        this.z = positionZ;
        this.setRandomGap();
        this.canMove = false;
    }

    move() {
        this.top.position.z += 0.1;
        this.bottom.position.z += 0.1;
        this.z += 0.1;
    }

    resetPosition(z) {
        this.top.position.z = z;
        this.bottom.position.z = z;
        this.z = z;
    }

    setRandomGap() {
        this.gap = parseInt((Math.random() * 16) + 1);
        // -45 to 61 is bottom limit
        this.bottom.position.y = -45 - this.gap;
        this.top.position.y = 61 - this.gap;
    }
}

class Player {
    constructor() {
        this.material = new THREE.MeshPhongMaterial({ color: 'orange' });
        this.mesh = new THREE.Mesh(playerGeometry, this.material);
        this.canMove = false;
    }

    moveUp() {
        if (this.mesh.position.y > 23) return;
        camera.position.y += 0.1;
        player.mesh.position.y += 0.1;
    }

    moveDown() {
        if (this.mesh.position.y < -23) return;
        camera.position.y -= 0.1;
        player.mesh.position.y -= 0.1;
    }
}

init();
function init() {
    scene.background = new THREE.Color('grey');
    scene.fog = new THREE.Fog('white', 30, 100);

    player = new Player();
    scene.add(player.mesh);

    for (let i = 0; i < totalPillars; i++) {
        pillars[i] = new Pillar(i, -(i * 20 + 20));
    }

    for (const pillar of pillars) {
        scene.add(pillar.top);
        scene.add(pillar.bottom);
    }

    const light = new THREE.AmbientLight('white', 3);
    scene.add(light);
}

function animate() {
    if (player.canMove) {
        if (keyPressed) player.moveUp();
        else player.moveDown();
    }

    for (const pillar of pillars) {
        if (pillar.canMove) pillar.move();

        // Collision detection
        if ((pillar.top.position.y - pillarHeight / 2 <= player.mesh.position.y + 3 / 2 || pillar.bottom.position.y + pillarHeight / 2 >= player.mesh.position.y - 3 / 2) &&
            pillar.z + pillarDepth / 2 >= player.mesh.position.z - 3 / 2) {
            console.log("collision with pillar");
        }

        // Pillars leave the view of camera
        if (pillar.z >= 0) {
            pillar.resetPosition(lastPositionZ);
            pillar.setRandomGap();
        }
    }
    renderer.render(scene, camera);
}

let keyPressed = false;
function onKeyDown(key) {
    if (key.code === 'Space') keyPressed = true;
}

function onKeyUp(key) {
    if (key.code === 'Space') keyPressed = false;
}

// Start the game with a click
document.addEventListener('click', () => {
    document.body.requestPointerLock();
    player.canMove = true;
    for (const pillar of pillars) {
        pillar.canMove = true;
    }
});

// Looking around in first person
document.addEventListener('mousemove', event => {
    if (!document.pointerLockElement) return;

    yaw -= event.movementX * rotationSpeed;
    pitch -= event.movementY * rotationSpeed;

    yaw = THREE.MathUtils.clamp(yaw, minYaw, maxYaw);
    pitch = THREE.MathUtils.clamp(pitch, -Math.PI / 2, Math.PI / 2);

    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
});

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

renderer.setAnimationLoop(animate);