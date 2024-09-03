import {
  Color,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  SphereGeometry,
  MeshMatcapMaterial,
  AxesHelper,
  RepeatWrapping,
  BufferAttribute,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'stats-js'
import LoaderManager from '@/js/managers/LoaderManager'
import GUI from 'lil-gui'
import { MeshLambertMaterial } from 'three'
import { DirectionalLight } from 'three'
import { AmbientLight } from 'three'
import { CircleGeometry } from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { TorusGeometry } from 'three'
import vertexShader from '../glsl/water/main.vert'
import fragmentShader from '../glsl/water/main.frag'
import mirrorVertexShader from '../glsl/mirror/main.vert'
import mirrorFragmentShader from '../glsl/mirror/main.frag'
import { BufferGeometry } from 'three'
import { PointsMaterial } from 'three'
import { Points } from 'three'
import { Vector3 } from 'three'
import { randFloat } from 'three/src/math/MathUtils'

export default class MainScene {
  #canvas
  #renderer
  #scene
  #camera
  #controls
  #stats
  #width
  #height
  #mesh
  #guiObj = {
    y: 0,
    showTitle: true,
  }

  constructor() {
    this.#canvas = document.querySelector('.scene')

    this.init()
  }

  init = async () => {
    // Preload assets before initiating the scene
    const assets = [
      {
        name: 'waterdudv',
        texture: './img/waterdudv.jpg',
      },
    ]

    await LoaderManager.load(assets)

    this.setStats()
    this.setGUI()
    this.setScene()
    this.setRender()
    this.setCamera()
    this.setControls()
    // this.setAxesHelper()

    this.setSphere()
    this.setTorus()
    this.setStarts()
    this.setReflector()
    this.setLight()

    this.handleResize()

    // start RAF
    this.events()
  }

  setStarts() {
    const geometry = new BufferGeometry()

    const range = 200
    const vertices = Array.from({ length: 1000 }).map(() => {
      const point = new Vector3(randFloat(-range, range), randFloat(20, range), randFloat(-range, range))
      return [...point];
    }).flat()

    // itemSize = 3 because there are 3 values (components) per vertex
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    const material = new PointsMaterial({ color: 0xffffff })
    const mesh = new Points(geometry, material)

    this.#scene.add(mesh)
  }

  setReflector() {
    const geometry = new CircleGeometry(40, 64)
    const customShader = Reflector.ReflectorShader
    // customShader.vertexShader = mirrorVertexShader
    // customShader.fragmentShader = mirrorFragmentShader
    customShader.vertexShader = vertexShader
    customShader.fragmentShader = fragmentShader

    const dudvMap = LoaderManager.assets['waterdudv'].texture

    dudvMap.wrapS = dudvMap.wrapT = RepeatWrapping
    customShader.uniforms.tDudv = { value: dudvMap }
    customShader.uniforms.time = { value: 0 }

    this.groundMirror = new Reflector(geometry, {
      clipBias: 0.003,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
      color: 0x000000,
      shader: customShader,
    })
    this.groundMirror.position.y = 0
    this.groundMirror.rotateX(-Math.PI / 2)
    this.#scene.add(this.groundMirror)
  }

  setLight() {
    const directionalLight = new DirectionalLight(0xffffff, 0.6)
    directionalLight.position.x = 1
    directionalLight.position.y = 1
    this.#scene.add(directionalLight)

    const ambientLight = new AmbientLight(0x888888)
    this.#scene.add(ambientLight)
  }

  /**
   * Our Webgl renderer, an object that will draw everything in our canvas
   * https://threejs.org/docs/?q=rend#api/en/renderers/WebGLRenderer
   */
  setRender() {
    this.#renderer = new WebGLRenderer({
      canvas: this.#canvas,
      antialias: true,
    })
  }

  /**
   * This is our scene, we'll add any object
   * https://threejs.org/docs/?q=scene#api/en/scenes/Scene
   */
  setScene() {
    this.#scene = new Scene()
    this.#scene.background = new Color(0x000424)
  }

  /**
   * Our Perspective camera, this is the point of view that we'll have
   * of our scene.
   * A perscpective camera is mimicing the human eyes so something far we'll
   * look smaller than something close
   * https://threejs.org/docs/?q=pers#api/en/cameras/PerspectiveCamera
   */
  setCamera() {
    const aspectRatio = this.#width / this.#height
    const fieldOfView = 60
    const nearPlane = 0.1
    const farPlane = 10000

    this.#camera = new PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)
    this.#camera.position.y = 5
    this.#camera.position.x = 5
    this.#camera.position.z = 5
    this.#camera.lookAt(0, 0, 0)

    this.#scene.add(this.#camera)
  }

  /**
   * Threejs controls to have controls on our scene
   * https://threejs.org/docs/?q=orbi#examples/en/controls/OrbitControls
   */
  setControls() {
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement)
    this.#controls.enableDamping = true
    // this.#controls.dampingFactor = 0.04
  }

  /**
   * Axes Helper
   * https://threejs.org/docs/?q=Axesh#api/en/helpers/AxesHelper
   */
  setAxesHelper() {
    const axesHelper = new AxesHelper(3)
    this.#scene.add(axesHelper)
  }

  /**
   * Create a SphereGeometry
   * https://threejs.org/docs/?q=box#api/en/geometries/SphereGeometry
   * with a Basic material
   * https://threejs.org/docs/?q=mesh#api/en/materials/MeshBasicMaterial
   */
  setSphere() {
    const geometry = new SphereGeometry(1, 32, 32)
    const material = new MeshLambertMaterial({ color: '#ffffff' })

    this.sphereMesh = new Mesh(geometry, material)
    this.#scene.add(this.sphereMesh)
  }

  setTorus() {
    const geometry = new TorusGeometry(1, 0.2, 16, 100)
    const material = new MeshLambertMaterial({ color: '#ffffff' })

    this.torusMesh = new Mesh(geometry, material)
    this.torusMesh.position.x = 1
    this.torusMesh.position.y = 3
    this.torusMesh.position.z = 3
    this.#scene.add(this.torusMesh)
  }

  /**
   * Build stats to display fps
   */
  setStats() {
    this.#stats = new Stats()
    this.#stats.showPanel(0)
    document.body.appendChild(this.#stats.dom)
  }

  setGUI() {
    const titleEl = document.querySelector('.main-title')

    const handleChange = () => {
      this.#mesh.position.y = this.#guiObj.y
      titleEl.style.display = this.#guiObj.showTitle ? 'block' : 'none'
    }

    const gui = new GUI()
    gui.add(this.#guiObj, 'y', -3, 3).onChange(handleChange)
    gui.add(this.#guiObj, 'showTitle').name('show title').onChange(handleChange)
  }
  /**
   * List of events
   */
  events() {
    window.addEventListener('resize', this.handleResize, { passive: true })
    this.draw(0)
  }

  // EVENTS

  /**
   * Request animation frame function
   * This function is called 60/time per seconds with no performance issue
   * Everything that happens in the scene is drawed here
   * @param {Number} now
   */
  draw = (time) => {
    // now: time in ms
    this.#stats.begin()

    if (this.#controls) this.#controls.update() // for damping
    this.#renderer.render(this.#scene, this.#camera)

    this.sphereMesh.position.y = Math.sin(time / 1000) + 3
    this.torusMesh.position.y = Math.sin(time / 1000) + 3
    this.torusMesh.rotation.x += 0.001
    this.torusMesh.rotation.y += 0.001
    this.torusMesh.rotation.z += 0.001

    this.groundMirror.material.uniforms.time.value += 0.12

    this.#stats.end()
    this.raf = window.requestAnimationFrame(this.draw)
  }

  /**
   * On resize, we need to adapt our camera based
   * on the new window width and height and the renderer
   */
  handleResize = () => {
    this.#width = window.innerWidth
    this.#height = window.innerHeight

    // Update camera
    this.#camera.aspect = this.#width / this.#height
    this.#camera.updateProjectionMatrix()

    const DPR = window.devicePixelRatio ? window.devicePixelRatio : 1

    this.#renderer.setPixelRatio(DPR)
    this.#renderer.setSize(this.#width, this.#height)
  }
}
