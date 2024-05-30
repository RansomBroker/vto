// Inisialisasi model deteksi pose tangan
const model = handPoseDetection.SupportedModels.MediaPipeHands;
const detectorConfig = {
    runtime: 'mediapipe',
    modelType: 'lite',
    maxHands: 1
};
let detector;

async function initHandPose() {
    detector = await handPoseDetection.createDetector(model, detectorConfig);
    await setupCamera();
    detectHand();
}

// Setup webcam
const video = document.createElement('video');
video.setAttribute('autoplay', '');
video.setAttribute('playsinline', '');

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
    });
    video.srcObject = stream;

    await new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });

    video.play();
}

// Setup scene Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

const loader = new THREE.GLTFLoader();
let watch;

loader.load('casio.glb', function (gltf) {
    watch = gltf.scene;
    scene.add(watch);
    watch.visible = false;
});

camera.position.z = 5;

// Fungsi untuk mendeteksi tangan dan mengupdate posisi jam tangan
async function detectHand() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const hands = await detector.estimateHands(video);

        if (hands.length > 0) {
            const keypoints = hands[0].keypoints;

            // Ambil posisi dari titik tertentu, misalnya pergelangan tangan (keypoint 0)
            const wrist = keypoints[0];

            if (watch) {
                // Konversi koordinat dari video ke koordinat scene Three.js
                const x = (wrist.x / video.videoWidth) * 2 - 1;
                const y = -(wrist.y / video.videoHeight) * 2 + 1;

                // Update posisi jam tangan
                watch.position.set(x, y, -1); // Skala sesuai kebutuhan
                watch.visible = true;
            }
        } else {
            if (watch) {
                watch.visible = false;
            }
        }
    }

    requestAnimationFrame(detectHand);
}

// Fungsi animasi Three.js
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Mulai deteksi pose tangan dan animasi
initHandPose();
animate();
