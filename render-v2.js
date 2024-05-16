THREE.SimplexNoise = SimplexNoise;

let scene, camera, renderer;
const terrainWidth = 100;
const terrainLength = 10;
const terrainMoveSpeed = 0.5;
const terrains = [];
const noiseGenerator = new THREE.SimplexNoise();

//global shits
let globalXOffset = Math.random() * 100;
const globalZOffsetIncrement = terrainLength / 10; // arbitrarily dividing by 10 to smooth transition
let globalZOffset = Math.random() * 100;
const clouds = [];
const NUM_CLOUDS = 10;
let isAnimating = true;
const textureLoader = new THREE.TextureLoader();
const cloudTexture = textureLoader.load(
  'https://media.istockphoto.com/id/1197853257/photo/white-cloud-background-and-texture-cloudy-day.webp?b=1&s=170667a&w=0&k=20&c=6juc7c_Q0YmMP95DfNx_G_uhCGapya9tLHF4GNRfy0M='
);
//start of scene
function init() {
  scene = new THREE.Scene();
  //set background color -- i like 0xffffff
  //some good ones i like
  //pastel blue: aec6cf
  //pastel lavender: e6e6fa
  scene.background = new THREE.Color('#FFF5E1');
  scene.fog = new THREE.Fog(0xfff5e1, 20, 100);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.y = 20;
  camera.position.z = 5;
  camera.lookAt(0, 5, -10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, -1);
  scene.add(directionalLight);
  setupShadows();

  // initial terrains
  for (let i = 0; i < 5; i++) {
    createSegmentedTerrains(-i * terrainLength);
  }
  createSkybox();
  createClouds();
  createSun();
  enhanceSunGlow(sun);
  animate();
}

function createClouds() {
  const particlesPerCloud = 500;
  const coresPerCloud = 3; // number of cores per cloud
  const particlesPerCore = particlesPerCloud / coresPerCloud;

  for (let i = 0; i < 30; i++) {
    const cloudGeometry = new THREE.BufferGeometry();
    const vertices = [];

    for (let core = 0; core < coresPerCloud; core++) {
      const coreX = (Math.random() - 0.5) * 10;
      const coreY = (Math.random() - 0.5) * 10;
      const coreZ = (Math.random() - 0.5) * 10;

      for (let j = 0; j < particlesPerCore; j++) {
        // distribute particles around the core using some variance
        const variance = 3; // adjust for how spread out particles should be around the core
        const x = coreX + (Math.random() - 0.5) * variance;
        const y = coreY + (Math.random() - 0.5) * variance;
        const z = coreZ + (Math.random() - 0.5) * variance;

        vertices.push(x, y, z);
      }
    }

    cloudGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    const cloudMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      map: cloudTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    const cloud = new THREE.Points(cloudGeometry, cloudMaterial);

    cloud.position.x = Math.random() * 60 - 30;
    cloud.position.y = Math.random() * 10 + 15;
    cloud.position.z = Math.random() * 40 - 50;

    scene.add(cloud);
    clouds.push(cloud);
  }
}

//put terrain
const waterLevel = -0.5; // value to change the water levels
function createSegmentedTerrains(zPosition) {
  const totalLength = terrainLength * 2; // double the terrain length
  const geometry = new THREE.PlaneGeometry(
    terrainWidth,
    totalLength,
    terrainWidth,
    totalLength
  );
  geometry.rotateX(-Math.PI / 2);

  const vertices = geometry.attributes.position.array;
  const xOffset = Math.random() * 100;
  const zOffset = Math.random() * 100;

  let colors = [];
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 2];
    const baseNoise = noiseGenerator.noise(
      (x + xOffset) / 10,
      (z + zOffset) / 10
    );
    const fineNoise = noiseGenerator.noise(
      (x + xOffset) / 5,
      (z + zOffset) / 5
    );
    let height = (baseNoise + fineNoise) * 3;
    vertices[i + 1] = height;

    // assign color based on height
    if (height < 0) {
      colors.push(0, 0, 0.5); // deep ocean
    } else if (height < 0.5) {
      colors.push(0, 0.4, 0.8); // shallow ocean
    } else if (height < 1) {
      colors.push(0.96, 0.91, 0.64); // beach
    } else if (height < 1.5) {
      colors.push(0.89, 0.85, 0.6); // sand dunes
    } else if (height < 2.5) {
      colors.push(0, 0.6, 0); // grassland
    } else if (height < 3) {
      colors.push(0, 0.4, 0.1); // forest
    } else if (height < 4) {
      colors.push(0.42, 0.33, 0.24); // hills
    } else if (height < 5) {
      colors.push(0.5, 0.35, 0.05); // mountains
    } else if (height < 6) {
      colors.push(1, 1, 1); // snow
    } else if (height < 6.5) {
      colors.push(0.98, 0.92, 0.7); // desert
    } else if (height < 7) {
      colors.push(0.1, 0.4, 0.2); // swamp/marsh
    } else if (height < 7.5) {
      colors.push(0.6, 0.6, 0.7); // tundra
    } else {
      colors.push(0.7, 0.2, 0.1); // lava/ volcanic
    }
  }

  // add the computed colors to the geometry
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  // now, cut this terrain into two segments:
  const firstHalfGeom = geometry.clone();
  firstHalfGeom.scale(1, 0.5, 1);
  const secondHalfGeom = geometry.clone();
  secondHalfGeom.scale(1, 0.5, 1);
  secondHalfGeom.translate(0, -terrainLength / 2, 0);

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  const firstTerrain = new THREE.Mesh(firstHalfGeom, material);
  firstTerrain.position.z = zPosition;
  const secondTerrain = new THREE.Mesh(secondHalfGeom, material);
  secondTerrain.position.z = zPosition - terrainLength;

  scene.add(firstTerrain);
  scene.add(secondTerrain);
  terrains.push(firstTerrain, secondTerrain);
}

function animate() {
  requestAnimationFrame(animate);

  // move terrains
  for (let terrain of terrains) {
    terrain.position.z += terrainMoveSpeed;

    // remove and replace terrain
    if (terrains[0].position.z > camera.position.z + terrainLength) {
      scene.remove(terrains[0]);
      scene.remove(terrains[1]);
      terrains.shift();
      terrains.shift();

      // replace the removed terrains with a new pair at the end
      createSegmentedTerrains(
        terrains[terrains.length - 1].position.z - terrainLength
      );
    }
  }

  for (let cloud of clouds) {
    cloud.position.z += 0.1; //  for faster/slower cloud movement

    // check if the cloud has passed the camera, then reset its position
    if (cloud.position.z > camera.position.z + 10) {
      cloud.position.z = Math.random() * 40 - 50; // reset to initial z-position
      cloud.position.x = Math.random() * 60 - 30; // random x position
      cloud.position.y = Math.random() * 10 + 15; // random y position in the sky
    }
  }
  renderer.render(scene, camera);
}

function createSkybox() {
  const skyGeometry = new THREE.BoxGeometry(500, 500, 500);

  // instead of using MeshBasicMaterial, I think we'll just use ShaderMaterial to handle vertex colors
  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `;

  const uniforms = {
    topColor: { value: new THREE.Color(0x0077ff) }, // sky color
    bottomColor: { value: new THREE.Color(0xffffff) }, // ground color
    offset: { value: 33 },
    exponent: { value: 0.6 },
  };

  const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    side: THREE.BackSide,
  });

  const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(skybox);
}

function setupShadows() {
  // enable shadow mapping in the renderer
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // adjust the light to cast shadows
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 512; // default is 512
  directionalLight.shadow.mapSize.height = 512; // default is 512
  directionalLight.shadow.camera.near = 0.5; // default is 0.5
  directionalLight.shadow.camera.far = 500; // default is 500
}

/*
  function createSun() {
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32); // increased the radius 
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      fog: false,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    //sun.position.set(0, 50, -50);
  
    sun.position.set(0, 18, -20);
  
    scene.add(sun);
  }
*/

function generateGlowTexture() {
  const textureSize = 512;
  const canvas = document.createElement('canvas');
  canvas.width = textureSize;
  canvas.height = textureSize;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(
    textureSize / 2,
    textureSize / 2,
    0,
    textureSize / 2,
    textureSize / 2,
    textureSize / 2
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.5)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, textureSize, textureSize);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createSun() {
  // generate sun glow texture
  const texture = generateGlowTexture();

  //create sun
  const sunGeometry = new THREE.CircleGeometry(3, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);

  // create the sprite for the glow
  const glowMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  const glowSprite = new THREE.Sprite(glowMaterial);
  glowSprite.scale.set(15, 15, 1);
  sun.add(glowSprite);

  sun.position.set(0, 18, -20);
  scene.add(sun);
}

//corona effect
function enhanceSunGlow(sun) {
  const scales = [15, 18, 22];
  const opacities = [0.6, 0.4, 0.2];

  for (let i = 0; i < scales.length; i++) {
    const texture = generateGlowTexture();
    const glowMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: opacities[i],
    });

    const glowSprite = new THREE.Sprite(glowMaterial);
    glowSprite.scale.set(scales[i], scales[i], 1);
    sun.add(glowSprite);
  }
}
