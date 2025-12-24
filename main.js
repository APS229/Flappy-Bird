import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const pillarWidth = 5;
const pillarHeight = 100;
const pillarDepth = 5;

const lastPositionZ = -100;
const pillars = [];
const totalPillars = 5;

const colors = ['blue', 'yellow', 'red', 'green', 'pink'];

const pillar1Geometry = new THREE.BoxGeometry(pillarWidth, pillarHeight, pillarDepth);
const pillar2Geometry = new THREE.BoxGeometry(pillarWidth, pillarHeight, pillarDepth);

const playerGeometry = new THREE.BoxGeometry(3, 3, 3);
let player = null;

let keyPressed = false;

class Pillar {
    constructor(id, positionZ) {
        this.id = id;
        this.material = new THREE.MeshPhongMaterial({ color: colors[id] });
        this.top = new THREE.Mesh(pillar1Geometry, this.material);
        this.bottom = new THREE.Mesh(pillar2Geometry, this.material);
        this.top.position.z = positionZ;
        this.bottom.position.z = positionZ;
        this.z = positionZ;
        this.setRandomGap();
        this.canMove = true;
    }

    move() {
        this.top.position.z += 0.1;
        this.bottom.position.z += 0.1;
        this.z += 0.1;
    }

    resetPosition() {
        this.top.position.z = lastPositionZ;
        this.bottom.position.z = lastPositionZ;
        this.z = lastPositionZ;
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
    }
}

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

init();
function init() {
    player = new Player();
    scene.add(player.mesh);

    for (let i = 0; i < totalPillars; i++) {
        pillars[i] = new Pillar(i, -(i * 20 + 20));
    }

    for (const pillar of pillars) {
        scene.add(pillar.top);
        scene.add(pillar.bottom);
    }

    const color = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 2, 1);
    scene.add(light);
}

function animate() {
    if (keyPressed) {
        if (camera.position.y <= 23) {
            camera.position.y += 0.1;
            player.mesh.position.y += 0.1;
        }
    }
    else {
        if (camera.position.y >= -23) {
            camera.position.y -= 0.1;
            player.mesh.position.y -= 0.1;
        }
    }

    for (const pillar of pillars) {
        if (pillar.canMove) pillar.move();
        if ((pillar.top.position.y - pillarHeight / 2 <= player.mesh.position.y + 3 / 2 || pillar.bottom.position.y + pillarHeight / 2 >= player.mesh.position.y - 3 / 2) &&
            pillar.z + pillarDepth / 2 >= player.mesh.position.z - 3 / 2) {
            console.log("collision with pillar");
        }
        if (pillar.z >= 0) {
            pillar.resetPosition();
            pillar.setRandomGap();
        }
    }
    renderer.render(scene, camera);
}

function onKeyDown(key) {
    if (key.code === 'ArrowUp') keyPressed = true;
}

function onKeyUp(key) {
    if (key.code === 'ArrowUp') keyPressed = false;
}

renderer.setAnimationLoop(animate);