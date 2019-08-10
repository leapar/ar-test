import * as THREE from '../../libs/vendors/three'
import * as THREEAR from '../../libs/vendors/THREEAR'

let camera, scene, renderer, canvas, matFrame, meshFrame
let id, torus, markerGroup
let frame, controller, lastTime = 0
let inited = false
let w, h
let frameSliceIndex

const app = getApp()
const RATIO = 4 / 3

Page({

  data: {
    canvasStyle: '',
    cameraStyle: ''
  },

  initStyles() {
    const info = wx.getSystemInfoSync()
    w = info.windowWidth
    h = w / RATIO | 0
    const style = `width:${w}px;height:${h}px;`
    this.setData({
      canvasStyle: style,
      cameraStyle: style
    })
  },

  initCamera() {
    const info = wx.getSystemInfoSync()
    const context = wx.createCameraContext()
    const listener = context.onCameraFrame((_frame) => {
      frame = _frame
      if (!inited) {
        this.initScene()
        inited = true
      }

    
      this.render(_frame);
    })
    listener.start()
  },

  debug() {
    const info = wx.getSystemInfoSync()
    const tw = info.windowWidth
    const th = info.windowHeight
    const sw = info.screenWidth
    const sh = info.screenHeight

    wx.showModal({
      title: '提示',
      content: `w: ${tw} h: ${th}`
    })
  },

  initScene() {
    const vw = frame.width
    const vh = frame.height

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: true
    });

    scene = new THREE.Scene()
    camera = new THREE.Camera()
    scene.add(camera)

    matFrame = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
    });
    var plane = new THREE.PlaneGeometry(1, 1, 1, 1);
    meshFrame = new THREE.Mesh(plane, matFrame);
    meshFrame.scale.y = meshFrame.scale.x = 11 //meshFrame.scale.z = 0.5;
    meshFrame.position.z = -10;
    camera.add(meshFrame);

    markerGroup = new THREE.Group()
    scene.add(markerGroup)

    const source = new THREEAR.Source({
      renderer,
      camera
    })

    THREEAR.initialize({
      source,
      canvasWidth: vw,
      canvasHeight: vh
    }).then((_controller) => {
      controller = _controller
      this.initialize(_controller)
     // this.render()
     this.initOver = true;
    })

    frameSliceIndex = vw * (frame.height - vh) * 4
  },

  initialize(controller) {
    const torusGeo = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16)
    const torusMat = new THREE.MeshNormalMaterial()
    torus = new THREE.Mesh(torusGeo, torusMat)
    torus.position.y = 0.5

    markerGroup.add(torus)
    const cubeGeo = new THREE.CubeGeometry(1, 1, 1)
    const cubeMat = new THREE.MeshNormalMaterial({
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    const cube = new THREE.Mesh(cubeGeo, cubeMat)
    cube.position.y = cubeGeo.parameters.height / 2
    markerGroup.add(cube)

    const patternMarker = new THREEAR.PatternMarker({
      patternUrl: 'https://www.xingway.com/ar/data/patt.hiro',
      markerObject: markerGroup
    })
    controller.trackMarker(patternMarker)
  },

  render(frame) {
    if (frame) {

      if (controller) {
        let rawData = new Uint8Array(frame.data)
        rawData = this.sliceData(rawData)
        controller.update(rawData)
        torus.rotation.y += 0.1 * Math.PI
        torus.rotation.z += 0.1 * Math.PI


      }
      


      if (!this.frameTexture) {
        console.log("!matFrame.map");
        var data = new Uint8Array(frame.data);
        this.frameTexture = new THREE.DataTexture(data, frame.width, frame.height, THREE.RGBAFormat);
        this.frameTexture.flipY = true;
        matFrame.map = this.frameTexture
      }
      this.frameTexture.image.data = new Uint8Array(frame.data);
      this.frameTexture.needsUpdate = true;
      renderer.render(scene, camera)
    }
  //  id = canvas.requestAnimationFrame(this.render.bind(this))
  },

  sliceData(rawData) {
    return rawData.slice(frameSliceIndex)
  },

  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#webgl').node().exec((res) => {
      canvas = res[0].node
      // this.initStyles()
      this.initCamera()
    })
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '78979898'
    })
    this.initCanvas()
  },

  onUnload() {
    canvas.cancelAnimationFrame(id)
  }

})