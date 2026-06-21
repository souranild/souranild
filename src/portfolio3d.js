import * as THREE from 'three';
import { gsap } from 'gsap';

// Data for Souranil Das Portfolio Cards
export const cardsData = [
    {
        id: 'about',
        title: 'About Me',
        subtitle: 'SOURANIL DAS',
        description: 'B.Tech in Electronics & Communication Engineering (ECE) from VIT Chennai. Passionate hardware verification engineer and IoT architect developing smart solutions.',
        bullets: ['VIT Chennai Graduate (ECE)', 'IoT & Embedded Systems Researcher', 'Hardware & Software integration enthusiast'],
        tags: ['ECE', 'IoT', 'AI/ML', 'Embedded Systems'],
        color: '#00f2fe',
        marioType: 'ground', // morphs to grass platform
        targetX: -6, targetY: -2, targetWidth: 6, targetHeight: 1
    },
    {
        id: 'experience',
        title: 'Experience',
        subtitle: 'NXP SEMICONDUCTORS',
        description: 'Design Verification (DV) Engineer at NXP Bangalore. Specializing in functional verification, building UVM testbenches, and validating complex SoC IPs.',
        bullets: ['Design Verification (DV) Team', 'SystemVerilog & UVM workflows', 'IP-level and System-level simulation'],
        tags: ['NXP', 'UVM', 'SystemVerilog', 'ASIC/FPGA'],
        color: '#38ef7d',
        marioType: 'bricks', // morphs to brick ledge
        targetX: 1, targetY: 0, targetWidth: 4, targetHeight: 0.8
    },
    {
        id: 'project-hydroponics',
        title: 'AI Hydroponics',
        subtitle: 'SMART CULTIVATION',
        description: 'IoT project: "Revolutionizing Holy-Basil Cultivation with AI-Enabled Hydroponics". Uses Azure IoT and Databricks to monitor and adapt lighting/pH parameters.',
        bullets: ['Featured IoT Research (2023)', 'Azure Cloud & Databricks AI', 'Automated parameter optimization'],
        tags: ['IoT', 'Azure', 'Databricks', 'Smart Agri'],
        color: '#ff2b2b',
        marioType: 'question', // morphs to a question mark block!
        targetX: -1, targetY: 1.5, targetWidth: 0.8, targetHeight: 0.8
    },
    {
        id: 'project-smade',
        title: 'SMADE Project',
        subtitle: 'ELDER MEDICAL ASSIST',
        description: 'Smart Medical Assist Device for Elders. An IoT-based device facilitating automated medicine dispensing, scheduling, and remote health telemetry.',
        bullets: ['Elderly Health Monitor (2022)', 'IoT Medication Reminders', 'Real-time Web Vitals tracking'],
        tags: ['IoT', 'Healthcare', 'Embedded Systems'],
        color: '#ff0844',
        marioType: 'question', // morphs to another question block
        targetX: 6, targetY: 2, targetWidth: 0.8, targetHeight: 0.8
    },
    {
        id: 'skills',
        title: 'Skills Matrix',
        subtitle: 'TECHNICAL STRENGTHS',
        description: 'Strong technical toolkit spanning low-level digital hardware design to high-level cloud computing and systems integration.',
        bullets: ['Hardware: SystemVerilog, UVM, FPGA, C', 'Software: Python, JS, C++, SQL', 'IoT: Azure IoT Hub, WebGL, APIs'],
        tags: ['Hardware', 'Software', 'Verification', 'Cloud'],
        color: '#fcd116',
        marioType: 'finish', // morphs to flag base
        targetX: 10, targetY: -2.5, targetWidth: 3, targetHeight: 0.8
    }
];

let scene, camera, renderer;
let cardMeshes = [];
let particlesMesh;
let raycaster, mouse;
let hoveredCard = null;
let activeCard = null;
let portfolioGroup;

// Details UI callback
let onCardClickedCallback = null;

// Initialize the 3D Portfolio
export function initPortfolio(canvasElement, onCardClicked) {
    onCardClickedCallback = onCardClicked;

    // Create scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 10);

    // Setup Renderer with alpha for background gradient
    renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Create group for easy parallax rotation
    portfolioGroup = new THREE.Group();
    scene.add(portfolioGroup);

    // Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f2fe, 1.2);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff0844, 0.6);
    dirLight2.position.set(-5, -5, 5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 15);
    pointLight.position.set(0, 0, 4);
    scene.add(pointLight);

    // Create cards
    createCards();

    // Create particles
    createParticles();

    // Setup raycaster and mouse
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Adjust camera position on resize
    resizePortfolio();
}

// Draw text card onto offscreen canvas for high-quality texturing
function createCardTexture(cardData) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');

    // Rounded rectangle helper
    function roundedRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // Draw card background (semi-transparent glassmorphic card)
    ctx.fillStyle = 'rgba(13, 17, 30, 0.95)';
    roundedRect(0, 0, canvas.width, canvas.height, 24);
    ctx.fill();

    // Draw colored side strip
    ctx.fillStyle = cardData.color;
    roundedRect(0, 0, 16, canvas.height, 24);
    ctx.fill();
    ctx.fillRect(8, 0, 8, canvas.height); // fill gap

    // Text Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Outfit", sans-serif';
    ctx.fillText(cardData.title, 40, 60);

    // Subtitle
    ctx.fillStyle = cardData.color;
    ctx.font = '600 18px "Outfit", sans-serif';
    ctx.fillText(cardData.subtitle, 40, 95);

    // Bullet points (draw up to 3)
    ctx.fillStyle = '#9aa0a6';
    ctx.font = '16px "Inter", sans-serif';
    cardData.bullets.forEach((bullet, index) => {
        ctx.fillText(`✦  ${bullet}`, 40, 145 + index * 32);
    });

    // Draw Tag Pills at bottom
    let xOffset = 40;
    ctx.font = 'bold 12px "Inter", sans-serif';
    cardData.tags.forEach(tag => {
        const textWidth = ctx.measureText(tag).width;
        const pillWidth = textWidth + 24;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        roundedRect(xOffset, 270, pillWidth, 28, 14);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(tag, xOffset + 12, 288);

        xOffset += pillWidth + 12;
    });

    return new THREE.CanvasTexture(canvas);
}

function createCards() {
    const cardGeometry = new THREE.BoxGeometry(2.4, 1.6, 0.1);

    cardsData.forEach((data, index) => {
        // Generate texture for card front
        const texture = createCardTexture(data);
        texture.colorSpace = THREE.SRGBColorSpace;

        // Custom materials for glassmorphism
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            map: texture,
            roughness: 0.15,
            metalness: 0.1,
            transmission: 0.6,
            ior: 1.5,
            thickness: 0.2,
            transparent: true,
            opacity: 0.95,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(cardGeometry, glassMaterial);
        
        // Custom variables stored directly in the mesh
        mesh.userData = { 
            data: data, 
            index: index, 
            originalPos: new THREE.Vector3(),
            floatOffset: Math.random() * Math.PI * 2,
            marioType: data.marioType,
            targetX: data.targetX,
            targetY: data.targetY,
            targetWidth: data.targetWidth,
            targetHeight: data.targetHeight
        };

        // Position cards in a beautiful 3D arc
        const angle = (index - (cardsData.length - 1) / 2) * 0.45;
        const radius = 6.2;
        mesh.position.set(Math.sin(angle) * radius, (index % 2 === 0 ? 0.3 : -0.3), -Math.cos(angle) * 1.5);
        mesh.rotation.y = -angle * 0.8;
        
        // Save original position for floats and recovery
        mesh.userData.originalPos.copy(mesh.position);
        mesh.userData.originalRot = mesh.rotation.clone();
        mesh.userData.originalScale = mesh.scale.clone();

        portfolioGroup.add(mesh);
        cardMeshes.push(mesh);
    });
}

function createParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const palette = [
        new THREE.Color('#00f2fe'),
        new THREE.Color('#ff0844'),
        new THREE.Color('#38ef7d'),
        new THREE.Color('#ffffff')
    ];

    for (let i = 0; i < particleCount * 3; i += 3) {
        // Spread particles randomly in a large bounding box
        positions[i] = (Math.random() - 0.5) * 20;
        positions[i + 1] = (Math.random() - 0.5) * 12;
        positions[i + 2] = (Math.random() - 0.5) * 10;

        const color = palette[Math.floor(Math.random() * palette.length)];
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Glowing particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 16, 16);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const material = new THREE.PointsMaterial({
        size: 0.08,
        map: pTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);
}

// Handle layout sizes
export function resizePortfolio() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    
    // Scale viewport according to size
    if (width < 768) {
        camera.position.z = 11;
        cardMeshes.forEach(mesh => {
            mesh.scale.set(0.7, 0.7, 0.7);
        });
    } else {
        camera.position.z = 8.5;
        cardMeshes.forEach(mesh => {
            mesh.scale.set(1, 1, 1);
        });
    }
    
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Gentle float and rotation animation
export function animatePortfolio(time) {
    if (!renderer) return;

    // Gentle floating loop for cards
    cardMeshes.forEach(mesh => {
        if (!mesh.userData.isMorphing && !mesh.userData.isMorphed) {
            const offset = mesh.userData.floatOffset;
            mesh.position.y = mesh.userData.originalPos.y + Math.sin(time * 0.0015 + offset) * 0.15;
            mesh.rotation.y = mesh.userData.originalRot.y + Math.cos(time * 0.001 + offset) * 0.05;
        }
    });

    // Slowly rotate background particles
    if (particlesMesh) {
        particlesMesh.rotation.y = time * 0.00003;
        particlesMesh.rotation.x = time * 0.000015;
    }

    renderer.render(scene, camera);
}

// Mouse movement parallax
export function handleMouseMove(clientX, clientY) {
    // Normalised device coordinates
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    // Subtle parallax shift for card group
    if (portfolioGroup && !cardMeshes[0].userData.isMorphed) {
        gsap.to(portfolioGroup.rotation, {
            y: mouse.x * 0.15,
            x: -mouse.y * 0.1,
            duration: 0.8,
            ease: 'power2.out'
        });
    }

    // Raycast check for hover state
    if (raycaster && camera && !cardMeshes[0].userData.isMorphed) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cardMeshes);

        if (intersects.length > 0) {
            const hitCard = intersects[0].object;
            if (hoveredCard !== hitCard) {
                // Remove glow from previous
                if (hoveredCard) {
                    gsap.to(hoveredCard.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.out' });
                    hoveredCard.material.opacity = 0.95;
                }
                hoveredCard = hitCard;
                // Add glow to hit card
                gsap.to(hoveredCard.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.3, ease: 'power2.out' });
                hoveredCard.material.opacity = 1.0;
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (hoveredCard) {
                gsap.to(hoveredCard.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.out' });
                hoveredCard.material.opacity = 0.95;
                hoveredCard = null;
                document.body.style.cursor = 'default';
            }
        }
    }
}

// Click checking
export function handleClick() {
    if (hoveredCard && !hoveredCard.userData.isMorphed) {
        activeCard = hoveredCard;
        if (onCardClickedCallback) {
            onCardClickedCallback(activeCard.userData.data);
        }
        
        // Camera swoop look at card
        const targetX = activeCard.position.x;
        const targetY = activeCard.position.y;
        
        gsap.to(camera.position, {
            x: targetX,
            y: targetY,
            z: 5.5,
            duration: 0.8,
            ease: 'power2.out'
        });
    } else {
        // Reset camera position
        activeCard = null;
        const targetZ = window.innerWidth < 768 ? 11 : 8.5;
        gsap.to(camera.position, {
            x: 0,
            y: 0,
            z: targetZ,
            duration: 0.8,
            ease: 'power2.out'
        });
        
        if (onCardClickedCallback) {
            onCardClickedCallback(null);
        }
    }
}

export function getThreeScene() {
    return scene;
}

export function getThreeCamera() {
    return camera;
}

export function getCardMeshes() {
    return cardMeshes;
}

export function getPortfolioGroup() {
    return portfolioGroup;
}
