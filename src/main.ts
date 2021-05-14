import mermaid from "mermaid";
import { Observable, of } from "rxjs";
import { exhaustMap, map, tap } from "rxjs/operators";

interface GraphConfig {
    graphDirection: string;
}

interface NodeChild {
    id: string;
    name: string;
}

interface Node {
    id: string
    name: string;
    type: NodeType;
    roads?: NodeChild[]
}

type NodeType = 'parent' | 'child'
type NodesByTypes = [Node[], Node[]];

let mermaidDiagram: HTMLElement = document.getElementById('mermaid-diagram');
let clear: HTMLElement = document.getElementById('clear');
let addNode: HTMLElement = document.getElementById('addNode');
let treeValidate: HTMLElement = document.getElementById('treeValidate');
let updateParent: HTMLElement = document.getElementById('updateParent');
let upload: HTMLElement = document.getElementById('upload');
let count: number = 1;
let startDiagram: string;
let tree: string;
let nodesTree: Node[] = [{
    id: '1',
    name: 'Nodo1',
    type: 'parent'
}, {
    id: '2',
    name: 'Nodo2',
    type: 'parent'
}];
const defaultGraphConfig: GraphConfig = {
    graphDirection: 'TB'
}

function getNodesByNodeType(nodesTree: Node[], type: NodeType): Observable<Node[]> {
    return of(nodesTree.filter((node: Node) => node.type === type));
}

function getTupleParentsWithChilds(parents: Node[], childs: Observable<Node[]>): Observable<NodesByTypes> {
    return childs.pipe(
        map((childs: Node[]) => [parents, childs] as NodesByTypes)
    );
}

function getGraphHead(config: GraphConfig): Observable<string> {
    return of(`graph ${config.graphDirection} \n`);
}

function getGraphWithParents(graph: string, parents: Node[]): Observable<string> {
    const loop: (parentGraph: string, actualNode: Node) => string = (parentGraph: string, actualNode: Node): string => {
        return (actualNode) ? `${parentGraph}${actualNode.id}((${actualNode.name}))\n`: parentGraph;
    };
    return of(`${graph}\n${parents.reduce(loop, '')}`);
}

function getGraphFromTuple(tuple: NodesByTypes, config: GraphConfig = defaultGraphConfig): Observable<string> {
    return of(null).pipe(
        exhaustMap(() => getGraphHead(config)),
        exhaustMap((graph: string) => getGraphWithParents(graph, tuple[0])),
        tap(x => console.log("%c Vamos => ", "background-color: orange; color: white", x)),
        exhaustMap(a => of(`
        graph ${config.graphDirection}
            subgraph vertical[Padres - Initials]
                1((Nodo 1))
            end vertical
        `))
    )
}

function getMermaidGraphFromNodesTree(nodesTree: Node[]): Observable<any> {
    return of(null).pipe(
        exhaustMap(() =>                getNodesByNodeType(nodesTree, 'parent')),
        exhaustMap((parents: Node[]) => getTupleParentsWithChilds(parents, getNodesByNodeType(nodesTree, 'child'))),
        exhaustMap((tuple: NodesByTypes) => getGraphFromTuple(tuple))
    )
}

function initStartDiagram(nodesTree: Node[]): void {
    getMermaidGraphFromNodesTree(nodesTree).subscribe((res: string) => {
        startDiagram = res;
        tree = startDiagram;
        mermaidDiagram.innerHTML = tree;
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                diagramPadding: 15,
                nodeSpacing: 20
            }
        });
    });
}

function increaseCounter(n: number): void {
    count = count + n;
}

function clearCounter(n: number): void {
    count = n;
}

function getCounter(): number {
    return count;
}

function getTree(): string {
    return tree;
}

function clearTree(): void {
    tree = startDiagram;
}

function AddNodeToTree(newNode: String): void {
    if (getCounter() > 2) {
        tree = tree.replace(`end childs`, `${newNode}\n end childs`);
    } else {
        tree =`
            ${tree}\n
            subgraph childs[Hijos - Transactionals]
            ${newNode}
            end childs
        `;
    }
}

function renderDiagram(diagram: string): void {
    mermaid.render("mermaid-diagram-svg", diagram, (svgCode) => {
        mermaidDiagram.innerHTML = svgCode;
    });
}

addNode.onclick = () => {
    const from = prompt('Seleccione nodo PADRE:')
    if (from) {
        increaseCounter(1)
        AddNodeToTree(`${from}-->${count}((Nodo ${count}))`);
        renderDiagram(getTree());
    }
}

clear.onclick = () => {
    clearTree();
    clearCounter(1);
    renderDiagram(getTree());
}

treeValidate.onclick = () => {
    console.log(getTree());
}

updateParent.onclick = () => {
    clearTree();
    clearCounter(1);
    renderDiagram(getTree());
}

upload.onclick = () => {
    renderDiagram(`
    %%{ initialize: { "theme": 'forest', "flowchart": { "useMaxWidth": false } } }%%
        graph TB
            subgraph vertical[Padres - Initials]
                1((Nodo 1))
            end vertical

            subgraph childs[Hijos - Transactionals]
                1-->2((Nodo 2))
                2-->3((Nodo 3))
                1-->4((Nodo 4))
                1-->5((Nodo 5))
                3-->6((Nodo 6))
                3-->7((Nodo 7))
                3-->8((Nodo 8))
                3-->9((Nodo 9))
                3-->10((Nodo 10))
                3-->11((Nodo 11))
                3-->12((Nodo 12))
                7-->13((Nodo 13))
                3-->14((Nodo 14))
                3-->15((Nodo 15))
                3-->16((Nodo 16))
                3-->17((Nodo 17))
                3-->18((Nodo 18))
                3-->19((Nodo 19))
                3-->20((Nodo 20))
                3-->21((Nodo 21))
            end childs
    `);
}

initStartDiagram(nodesTree);