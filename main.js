import * as THREE from 'three';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const minView = -Math.PI / 4;
const maxView = Math.PI / 4;
const viewSpeed = 0.002; // radians
let yaw = 0;
let pitch = 0;
let twoDimensional = false;
camera.rotation.order = 'YXZ';

const PILLAR_WIDTH = 5;
const PILLAR_HEIGHT = 100;
const PILLAR_DEPTH = 5;
const PILLAR_SPEED = 0.2;
const PILLAR_GAP_SIZE = 110;
const PILLAR_GAP_POSITION = 24;
const pillarGeometry = new THREE.BoxGeometry(PILLAR_WIDTH, PILLAR_HEIGHT, PILLAR_DEPTH);


const pillars = [];
const totalPillars = 8;
const lastPositionZ = -(totalPillars * 20);

const PLAYER_DIMENSIONS = 3;
const PLAYER_SPEED = 0.2;
const playerGeometry = new THREE.BoxGeometry(PLAYER_DIMENSIONS, PLAYER_DIMENSIONS, PLAYER_DIMENSIONS);

let player = null;

class Pillar {
    constructor(id, positionZ) {
        this.id = id;
        this.material = new THREE.MeshPhongMaterial({ color: 'green' });
        this.top = new THREE.Mesh(pillarGeometry, this.material);
        this.bottom = new THREE.Mesh(pillarGeometry, this.material);
        this.top.position.z = positionZ;
        this.bottom.position.z = positionZ;
        this.z = positionZ;
        this.canMove = false;
        this.setRandomGapPosition();
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

    setRandomGapPosition() {
        this.randomGapPosition = parseInt((Math.random() * PILLAR_GAP_POSITION) + 1);
        this.top.position.y = (PILLAR_GAP_SIZE / 2) + this.randomGapPosition / 2;
        this.bottom.position.y = -(PILLAR_GAP_SIZE / 2) + this.randomGapPosition / 2;
    }
}

class Player {
    constructor() {
        this.material = new THREE.MeshPhongMaterial({ color: 'yellow' });
        this.mesh = new THREE.Mesh(playerGeometry, this.material);
        this.canMove = false;
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
    scene.background = new THREE.Color('grey');

    player = new Player();
    scene.add(player.mesh);

    for (let i = 0; i < totalPillars; i++) {
        pillars[i] = new Pillar(i, -(i * 20 + 20));
    }

    for (const pillar of pillars) {
        scene.add(pillar.top);
        scene.add(pillar.bottom);
    }

    const dLight = new THREE.DirectionalLight('white', 1);
    const aLight = new THREE.AmbientLight('white', 2);
    scene.add(dLight);
    scene.add(aLight);

    // Camera perspective from front of the bird
    camera.position.z = -PLAYER_DIMENSIONS / 2;
}

function animate() {
    if (player.canMove) {
        if (keyPressed) player.moveUp();
        else player.moveDown();
    }

    for (const pillar of pillars) {
        if (pillar.canMove) pillar.move();

        // Collision detection
        if ((pillar.top.position.y - PILLAR_HEIGHT / 2 <= player.mesh.position.y + PLAYER_DIMENSIONS / 2 ||
            pillar.bottom.position.y + PILLAR_HEIGHT / 2 >= player.mesh.position.y - PLAYER_DIMENSIONS / 2) &&
            pillar.z + PILLAR_DEPTH / 2 >= player.mesh.position.z - PLAYER_DIMENSIONS / 2 &&
            pillar.z - PILLAR_DEPTH / 2 <= player.mesh.position.z + PLAYER_DIMENSIONS / 2) {
            console.log('dead');
            player.material.color.setColorName('red');
        }

        // Pillar goes behind the bird
        if (pillar.z >= 60) {
            pillar.resetPosition(lastPositionZ + 60);
            pillar.setRandomGapPosition();
        }
    }
    renderer.render(scene, camera);
}

let keyPressed = false;
function onKeyDown(key) {
    if (key.code === 'Space') keyPressed = true;
    // Change camera perspective to 2D
    else if (key.code === 'KeyP') {
        twoDimensional = true;
        camera.rotation.set(0, Math.PI / 2, 0);
        camera.position.set(40, 0, -20);
    }
}

function onKeyUp(key) {
    if (key.code === 'Space') keyPressed = false;
}

// Start the game with a click
function onClick() {
    document.body.requestPointerLock();
    player.canMove = true;
    for (const pillar of pillars) {
        pillar.canMove = true;
    }
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

document.addEventListener('click', onClick);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

renderer.setAnimationLoop(animate);