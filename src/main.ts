import mermaid from "mermaid";
import { Observable, of } from "rxjs";
import { exhaustMap, map, tap } from "rxjs/operators";

interface GraphConfig {
    graphDirection: string;
}

interface Node {
    id: string
    name: string;
    type: NodeType;
    roads?: string[];
}

type NodeType = 'parent' | 'child';

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
    id: 'Nodo_1',
    name: 'Nodo 1',
    type: 'parent',
    roads: [
        'Nodo_3',
        'Nodo_8',
        'Nodo_10',
        'Nodo_11',
    ]
}, {
    id: 'Nodo_2',
    name: 'Nodo 2',
    type: 'parent'
}, {
    id: 'Nodo_10',
    name: 'Nodo 10',
    type: 'child',
    roads: [
        'Nodo_3',
        'Nodo_8',
        'Nodo_10',
    ]
}, {
    id: 'Nodo_11',
    name: 'Nodo 11',
    type: 'child',
    roads: [
        'Nodo_30'
    ]
}, {
    id: 'Nodo_8',
    name: 'Nodo 8',
    type: 'child'
}, {
    id: 'Nodo_9',
    name: 'Nodo 9',
    type: 'child',
    roads: [
        'Nodo_8'
    ]
}];
const defaultGraphConfig: GraphConfig = {
    graphDirection: 'TB'
}

function getNodesByNodeType(nodesTree: Node[], type: NodeType): Observable<Node[]> {
    return of(nodesTree.filter((node: Node) => node.type === type));
}

function getGraphHead(config: GraphConfig): Observable<string> {
    return of(`graph ${config.graphDirection}\n`);
}

function getNodeGraph(node: Node): string {
    return `${node.id}((${node.name}))`;
}

function getSubgraph(content: string, subgraphName: string): Observable<string> {
    return of(`subgraph ${subgraphName}\n${content}end\n`);
}

function getGraphByNodeTypeWithoutRoads(nodes: Node[], nodeType: NodeType): Observable<string> {
    const loop: (graphTmp: string, actualNode: Node) => string = (graphTmp: string, actualNode: Node): string => {
        if (actualNode && actualNode.type === nodeType) {
            graphTmp = `${graphTmp}${getNodeGraph(actualNode)}\n`;
        }

        return graphTmp;
    };

    return of(nodes.reduce(loop, ''));
}

function getNodeGraphWithRoads(actualGraph: string, actualNode: Node): string {
    const loop: (graphTmp: string, actualRoad: string) => string = (graphTmp: string, actualRoad: string): string => {
        return `${graphTmp}${getNodeGraph(actualNode)}-->${actualRoad}\n`;
    }

    return (actualNode.roads) ? `${actualGraph}${actualNode.roads.reduce(loop, '')}` : `${actualGraph}${getNodeGraph(actualNode)}\n`;
}

function getGraphWithRoads(nodes: Node[]): Observable<string> {
    const loop: (graphTmp: string, actualNode: Node) => string = (graphTmp: string, actualNode: Node): string => {
        graphTmp = getNodeGraphWithRoads(graphTmp, actualNode);
        return graphTmp;
    };

    return of(nodes.reduce(loop, ''));
}

function getMermaidGraphFromNodesTree(nodesTree: Node[], config: GraphConfig = defaultGraphConfig): Observable<any> {
    return of(null).pipe(
        exhaustMap(() =>                getNodesByNodeType(nodesTree, 'parent')),
        exhaustMap((parents: Node[]) => getGraphByNodeTypeWithoutRoads(parents, 'parent')),
        exhaustMap((ggbntwr: string) => getSubgraph(ggbntwr, '-')),
        exhaustMap((subgGgbntwr: string) => getGraphWithRoads(nodesTree).pipe(
            exhaustMap((ggwr: string) => getSubgraph(ggwr, '.')),
            map((subgGgwr: string) => `${subgGgbntwr}\n${subgGgwr}`)
        )),
        exhaustMap((bodyGraph: string) => getGraphHead(config).pipe(
            map((headGraph: string) => `${headGraph}${bodyGraph}`)
        )),
        tap(x => console.log("%c Vamos => ", "background-color: orange; color: white", x))
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
                useMaxWidth: true
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
    console.log(nodesTree);
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
                1((Nodo 1))-->2((Nodo 2))
                2-->3((Nodo 3))
                1((Nodo 1))-->4((Nodo 4))
                1((Nodo 1))-->5((Nodo 5))
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