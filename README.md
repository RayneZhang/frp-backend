# FRP Backend
This library is a backend for the FlowMatic system.

Example client-side use:
```
const scene = new Scene(); // create a new scene object
const drawing =  new SceneDisplay('drawing', scene); // Create a drawing output (looks for a <div> with id='drawing')

const ten = scene.addConstant(10);
const twenty = scene.addConstant(20);
const thirty = scene.addConstant(30);

const plus = scene.addOp('+');

scene.addEdge(ten, plus);
scene.addEdge(twenty, plus); // Assumes default property ('')

scene.addEdge({
    node: thirty,
    prop: ''
}, {
    node: plus,
    prop: ''
});

scene.removeNode(thirty);
```


To build client-side library:
```
npm run webpack
```

To build client-side library (and watch for changes):
```
npm run watch
```