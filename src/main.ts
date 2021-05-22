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
let addNode: HTMLElement = document.getElementById('addNode');
let editNode: HTMLElement = document.getElementById('editNode');
let treeValidate: HTMLElement = document.getElementById('treeValidate');
let updateParent: HTMLElement = document.getElementById('updateParent');
let upload: HTMLElement = document.getElementById('upload');
let tree: string;
let nodesTree: Node[] = [];
const defaultGraphConfig: GraphConfig = {
    graphDirection: 'TB'
}

function setNodesTree(newNodesTree: Node[]): void {
    nodesTree = newNodesTree;
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

function buildFinalGraph(subgGgbntwr: string, nodesTree: Node[]): Observable<string> {
    if (nodesTree.length > 1) {
        return getGraphWithRoads(nodesTree).pipe(
            exhaustMap((ggwr: string) => getSubgraph(ggwr, '.')),
            map((subgGgwr: string) => `${subgGgbntwr}\n${subgGgwr}`)
        );
    } else {
        return of(`${subgGgbntwr}`);
    }
}

function getMermaidGraphFromNodesTree(nodesTree: Node[], config: GraphConfig = defaultGraphConfig): Observable<string> {
    return of(null).pipe(
        exhaustMap(() =>                getNodesByNodeType(nodesTree, 'parent')),
        exhaustMap((parents: Node[]) => getGraphByNodeTypeWithoutRoads(parents, 'parent')),
        exhaustMap((ggbntwr: string) => getSubgraph(ggbntwr, '-')),
        exhaustMap((subgGgbntwr: string) => buildFinalGraph(subgGgbntwr, nodesTree)),
        exhaustMap((bodyGraph: string) => getGraphHead(config).pipe(
            map((headGraph: string) => `${headGraph}${bodyGraph}`)
        )),
        tap(x => console.log("%c Vamos => ", "background-color: orange; color: white", x))
    )
}

function initStartDiagram(nodesTree: Node[]): void {
    getMermaidGraphFromNodesTree(nodesTree).subscribe((res: string) => {
        tree = res;
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

function renderDiagram(diagram: string): void {
    mermaid.render("mermaid-diagram-svg", diagram, (svgCode) => {
        mermaidDiagram.innerHTML = svgCode;
    });
}

function getTree(): string {
    return tree;
}

function createNode(nodeId: string, nodeType: NodeType = 'child'): Observable<Node> {
   const name: string = nodeId.replace('_', ' ');
    return of({
    id: nodeId,
    name: name,
    type: nodeType,
    });
}

function addNodeToTree(node: Node, nodesTree: Node[]): Observable<Node[]> {
    if (nodesTree.filter((n: Node) => n.id === node.id).length === 0) {
        nodesTree.push(node);
    }
    return of(nodesTree);
}

function updateParentRoads(parentId: string, nodeId: string, newNodesTree: Node[]): Observable<Node[]> {
    return of(newNodesTree.map((node: Node) => {
        if(node.id === parentId) {
            node.roads = (node.roads) ? [...node.roads, nodeId] : [nodeId];
        }
        return node;
    }));
}

addNode.onclick = () => {
    const parentId = prompt('Digite nodo PADRE:');
    const nodeId = prompt('Digite el ID del nodo:');
    if (parentId && nodeId) {
        of(null).pipe(
            exhaustMap(() => createNode(nodeId)),
            exhaustMap((newNode: Node) => addNodeToTree(newNode, [...nodesTree])),
            exhaustMap((newNodesTree: Node[]) => updateParentRoads(parentId, nodeId, newNodesTree)),
            tap((newNodesTree: Node[]) => setNodesTree(newNodesTree)),
            exhaustMap((newNodesTree: Node[]) => getMermaidGraphFromNodesTree(newNodesTree))
        ).subscribe((graph: string) => {
            renderDiagram(graph);
        });
    }
}

function removeNodeFromTree(actualNodeId: string, nodesTree: Node[]): Observable<Node[]> {
    return of(nodesTree.filter((node: Node) => node.id !== actualNodeId));
}

function getNodeFromTree(actualNodeId: string, nodesTree: Node[]): Observable<Node> {
    return of(nodesTree.find((node: Node) => node.id === actualNodeId));
}

function updateRoadsAfterUpdate(newNodesTree: Node[], newNodeId: string, actualNodeId: string): Observable<Node[]> {
    return of(newNodesTree.map((node: Node) => {
        if(node.roads && node.roads.includes(actualNodeId)) {
            const roadsWithoutActual: string[] = node.roads.filter(road => road !== actualNodeId);
            node.roads = [...roadsWithoutActual, newNodeId];
        }

        return node;
    }));
}

editNode.onclick = () => {
    const actualNodeId: string = prompt('Digite el ID del nodo a editar:');
    const newNodeId: string = prompt('Digite el ID del nuevo nodo:');
    if (actualNodeId && newNodeId) {
        of(null).pipe(
            exhaustMap(() => getNodeFromTree(actualNodeId, nodesTree)),
            exhaustMap((oldNode: Node) => removeNodeFromTree(actualNodeId, nodesTree).pipe(
                map((nodesTree: Node[]) => [...nodesTree, {...oldNode, id: newNodeId, name: newNodeId}])
            )),
            exhaustMap((newNodesTree: Node[]) => updateRoadsAfterUpdate(newNodesTree, newNodeId, actualNodeId)),
            tap((nodesTreeUpdated: Node[]) => {
                setNodesTree(nodesTreeUpdated)
            }),
            exhaustMap((nodesTreeUpdated: Node[]) => getMermaidGraphFromNodesTree(nodesTreeUpdated))
        ).subscribe((graph: string) => {
            renderDiagram(graph);
        });
    }
}

treeValidate.onclick = () => {
    console.log(getTree());
    console.log(nodesTree);
}

updateParent.onclick = () => {
    const parentId: string = prompt('Seleccione nodo PADRE:');
    if(parentId) {
        of(null).pipe(
            exhaustMap(() => createParentNode(parentId)),
            exhaustMap((nodesTree: Node[]) => getMermaidGraphFromNodesTree(nodesTree))
        ).subscribe((graph: string) => {
            renderDiagram(graph);
        });
    }
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

function createParentNode(parentId: string): Observable<Node[]> {
    return of(null).pipe(
        exhaustMap(() => createNode(parentId, 'parent')),
        exhaustMap((newNode: Node) => addNodeToTree(newNode, [])),
        tap((newNodesTree: Node[]) => setNodesTree(newNodesTree))
    );
}

(function() {
    const parentId: string = prompt('Seleccione nodo PADRE:');
    createParentNode(parentId).subscribe((nodesTree: Node[]) => initStartDiagram(nodesTree));
})();
