import { Node, IO, NodeLayout, NodePropLayout } from './Node';
import { Edge, EdgeLayout } from './Edge';
import { Scene } from './Scene';
import * as SVG from 'svg.js';
import { difference, getPropID } from './SceneLayout';
import { Subscription } from 'rxjs';

export class SceneDisplay {
    private nodeDisplays: Map<string, NodeDisplay> = new Map();
    private edgeDisplays: Map<string, EdgeDisplay> = new Map();
    private svg: SVG.Doc;
    constructor(private id: string, private scene: Scene) {
        this.svg = SVG(id);
        this.scene.getNodesStream().subscribe((nodes: Node[]) => {
            const desiredIDs = nodes.map((n) => n.getID());
            const existingIDs = Array.from(this.nodeDisplays.keys());

            const toAdd = new Set(difference(desiredIDs, existingIDs));
            const toRemove = new Set(difference(existingIDs, desiredIDs));

            toRemove.forEach((tr) => {
                const display = this.nodeDisplays.get(tr);
                display.remove();
                this.nodeDisplays.delete(tr);
            });
            nodes.forEach((n) => {
                const nid = n.getID();
                if(toAdd.has(nid)) {
                    const display = new NodeDisplay(this.svg, n);
                    this.nodeDisplays.set(nid, display);
                }
            });
        });
        this.scene.getEdgesStream().subscribe((edges: Edge[]) => {
            const desiredIDs = edges.map((e) => e.getID());
            const existingIDs = Array.from(this.edgeDisplays.keys());

            const toAdd = new Set(difference(desiredIDs, existingIDs));
            const toRemove = new Set(difference(existingIDs, desiredIDs));

            toRemove.forEach((tr) => {
                const display = this.edgeDisplays.get(tr);
                display.remove();
                this.edgeDisplays.delete(tr);
            })

            edges.forEach((e) => {
                const eid =  e.getID();
                if(toAdd.has(eid)) {
                    const display = new EdgeDisplay(this.svg, e);
                    this.edgeDisplays.set(eid, display);
                }
            });
        });
    }
}
export class NodeDisplay {
    private propDisplays: Map<string, PropDisplay> = new Map();
    private rect: SVG.Rect;
    private label: SVG.Text;
    private layoutSubscription: Subscription;
    constructor(private svg: SVG.Doc, private node: Node) {
        this.rect = this.svg.rect(0, 0).attr({
            'fill-opacity': 0,
            'stroke': '#000',
            'stroke-width': 1
        });
        this.label = this.svg.text(this.node.getLabel());

        this.layoutSubscription = this.node.getLayoutStream().subscribe((layout: NodeLayout) => {
            this.rect.attr({
                width: layout.width,
                height: layout.height,
                x: layout.x - layout.width/2,
                y: layout.y - layout.height/2
            });
            this.label.move(layout.x-layout.width/2 + 5, layout.y - layout.height/2 + 5);

            const inputs = Object.keys(layout.inputs).map((k) => [k, layout.inputs[k], IO.Input]);
            const outputs = Object.keys(layout.outputs).map((k) => [k, layout.outputs[k], IO.Output]);

            const ios =   [...inputs, ...outputs];
            const desiredKeys =  [];
            ios.forEach(([key, layout, io]: [string, NodePropLayout, IO]) => {
                const propID = getPropID(this.node.getID(), key, io);
                // console.log(propID, key, name, io);
                desiredKeys.push(propID);
                if(!this.propDisplays.has(propID)) {
                    // console.log('create');
                    this.propDisplays.set(propID, new PropDisplay(this.svg, this.node, key, io));
                }
                const propDisplay = this.propDisplays.get(propID);
                propDisplay.setLayout(layout);
            });

            const toRemoveKeys = [];
            this.propDisplays.forEach((display: PropDisplay, key: string) => {
                if(desiredKeys.indexOf(key) < 0) {
                    display.remove();
                    toRemoveKeys.push(key);
                }
            })
            toRemoveKeys.forEach((k)  => this.propDisplays.delete(k));
        });
    }

    public remove(): void {
        this.rect.remove();
        this.label.remove();
        this.propDisplays.forEach((propDisplay: PropDisplay) => {
            propDisplay.remove();
        });
        this.layoutSubscription.unsubscribe();
    }
}

export class PropDisplay {
    private rect: SVG.Rect;
    private label: SVG.Text;
    private outputSubscription: Subscription;
    constructor(private svg: SVG.Doc, private node: Node, private propName: string, private io: IO) {
        this.rect = this.svg.rect(0, 0).attr({
            'fill-opacity': 0,
            'stroke': io === IO.Input ? '#000' : '#F00',
            'stroke-width': 1
        });
        this.label = this.svg.text(`'${this.propName}'`);
        if(this.io === IO.Output) {
            this.outputSubscription = this.node.pluckOutput(this.propName).subscribe((value) => {
                this.label.text(`'${this.propName}': ${JSON.stringify(value)}`);
            });
        }
    }

    public setLayout(layout: NodePropLayout): void {
        this.rect.attr({
            width: layout.width,
            height: layout.height,
            x: layout.x - layout.width/2,
            y: layout.y - layout.height/2
        });
        this.label.move(layout.x-layout.width/2+5, layout.y - layout.height/2 + 5);
    }

    public remove(): void {
        if(this.outputSubscription) {
            this.outputSubscription.unsubscribe();
        }
        this.rect.remove();
        this.label.remove();
    }
}

export class EdgeDisplay {
    private line: SVG.Path;
    constructor(private svg: SVG.Doc, private edge: Edge) {
        this.line = this.svg.path('').attr({
            'fill-opacity': 0,
            'stroke': '#000',
            'stroke-width': 1
        });
        this.edge.getLayoutStream().subscribe((layout: EdgeLayout) => {
            const { points } = layout;
            if(points.length > 1) {
                const pointStrings = points.map(pnt => `${pnt.x} ${pnt.y}`);
                let pathString = `M ${pointStrings[0]}`;
                for (let i: number = 1; i < pointStrings.length - 1; i += 2) {
                    pathString += ` Q ${pointStrings[i]} ${pointStrings[i + 1]}`;
                }
                const sndLstPnt = points[points.length - 2];
                const lastPnt = points[points.length - 1];
        
                pathString += EdgeDisplay.getArrowPath(sndLstPnt, lastPnt);
                this.line.plot(pathString);
            }
        });
    }
    public remove(): void {
        this.line.remove();
    }
    private static getArrowPath(sndLstPnt: {x: number, y: number}, lastPnt: {x: number, y: number}): string {
        const theta = Math.atan2(sndLstPnt.y - lastPnt.y, sndLstPnt.x - lastPnt.x);
        const offset = 20 * Math.PI / 180;
        const s = 10;
        const pathString = ` m ${Math.cos(theta + offset) * s} ${Math.sin(theta + offset) * s}` +
                           ` L ${lastPnt.x} ${lastPnt.y}` +
                           ` l ${Math.cos(theta - offset) * s} ${Math.sin(theta - offset) * s}`;
        return pathString;
    }
}