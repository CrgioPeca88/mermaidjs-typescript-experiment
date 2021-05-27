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
let mermaidDiagram2: HTMLElement = document.getElementById('mermaid-diagram2');
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
        const testD = `
          graph LR
            n1([Nodo 1])===>n2([Nodo 2])
        `
        mermaid.render("mermaid-diagram-svg", tree, (svgCode) => {
            mermaidDiagram.innerHTML = svgCode;
        });

        mermaid.render("mermaid-diagram-svg2", testD, (svgCode) => {
            mermaidDiagram2.innerHTML = svgCode;
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

interface Element {
  id: number;
  key: string;
  roads: string[]
}

const maxDefaultValue = 800;
const rankSpacingValue = {
  '0': 50,
  '1': 50,
  '2': 100,
  '3': 400,
  '4': 600,
  '5': 600
}

function getRankSpacing(): number {
  const elementList: Element[]= [{
		"id": 29,
		"key": "vertical_restaurant",
		"roads": [
			"ticket_type_pi",
			"ticket_type_tpd",
			"ticket_type_pme"
		]
	},
	{
		"id": 28,
		"key": "ticket_type_pi",
		"roads": [
			"product_type_product",
			"product_type_topping_with_price",
			"product_type_priceless_topping",
			"product_type_synthetic_main_topping",
			"product_type_synthetic_secondary_topping",
			"product_type_synthetic_beverage_topping",
			"product_type_synthetic_addition_topping",
			"product_type_napkin_topping"
		],
	},
	{
		"id": 21,
		"key": "product_type_product",
		"roads": [
			"first_iteration",
			"second_iteration",
			"third_iteration"
		],
	},
	{
		"id": 14,
		"key": "first_iteration",
	},
	{
		"id": 13,
		"key": "second_iteration",
	},
	{
		"id": 12,
		"key": "third_iteration",
	},
	{
		"id": 20,
		"key": "product_type_topping_with_price",
		"roads": [
			"first_iteration",
			"second_iteration",
			"third_iteration"
		],
	},
	{
		"id": 19,
		"key": "product_type_priceless_topping",
		"roads": [
			"first_iteration",
			"second_iteration",
			"third_iteration"
		],
	},
	{
		"id": 18,
		"key": "product_type_synthetic_main_topping",
		"roads": [
			"first_iteration",
			"second_iteration",
			"third_iteration"
		],
	},
	{
		"id": 17,
		"key": "product_type_synthetic_secondary_topping",
		"roads": [
			"first_iteration",
			"second_iteration",
			"third_iteration"
		],
	},
	{
		"id": 16,
		"key": "product_type_synthetic_beverage_topping",
		"roads": [
			"first_iteration",
			"second_iteration",
			"third_iteration"
		],
	},
	{
		"id": 15,
		"key": "product_type_synthetic_addition_topping",
		"roads": [
			"first_iteration",
			"second_iteration",
			"third_iteration"
		],
	},
	{
		"id": 51,
		"key": "product_type_napkin_topping",
		"roads": [
			"first_iteration",
			"second_iteration",
			"third_iteration"
		],
	},
	{
		"id": 27,
		"key": "ticket_type_tpd",
		"roads": [
			"product_type_product",
			"product_type_topping_with_price",
			"product_type_priceless_topping",
			"product_type_synthetic_main_topping",
			"product_type_synthetic_secondary_topping",
			"product_type_synthetic_beverage_topping",
			"product_type_synthetic_addition_topping"
		],
	},
	{
		"id": 26,
		"key": "ticket_type_pme",
		"roads": [
			"product_temperature",
			"broke_spilled",
			"bad_packaged",
			"product_quality"
		],
	},
	{
		"id": 25,
		"key": "product_temperature",
		"roads": [
			"product_type_product",
			"product_type_topping_with_price",
			"product_type_priceless_topping",
			"product_type_synthetic_main_topping",
			"product_type_synthetic_secondary_topping",
			"product_type_synthetic_beverage_topping",
			"product_type_synthetic_addition_topping"
		],
	},
	{
		"id": 24,
		"key": "broke_spilled",
		"roads": [
			"product_type_product",
			"product_type_topping_with_price",
			"product_type_priceless_topping",
			"product_type_synthetic_main_topping",
			"product_type_synthetic_secondary_topping",
			"product_type_synthetic_beverage_topping",
			"product_type_synthetic_addition_topping"
		],
	},
	{
		"id": 23,
		"key": "bad_packaged",
		"roads": [
			"product_type_product",
			"product_type_topping_with_price",
			"product_type_priceless_topping",
			"product_type_synthetic_main_topping",
			"product_type_synthetic_secondary_topping",
			"product_type_synthetic_beverage_topping",
			"product_type_synthetic_addition_topping"
		],
	},
	{
		"id": 22,
		"key": "product_quality",
		"roads": [
			"product_type_product",
			"product_type_topping_with_price",
			"product_type_priceless_topping",
			"product_type_synthetic_main_topping",
			"product_type_synthetic_secondary_topping",
			"product_type_synthetic_beverage_topping",
			"product_type_synthetic_addition_topping"
		],
	}
];

  const loop = (nodesCount: number, ele: Element): number => {
    nodesCount = ele?.roads?.length >= 6 ? nodesCount + 1 : nodesCount
    return nodesCount;
  };

  const countNodesWithNlines: number = elementList.reduce(loop, 0);
  return rankSpacingValue[countNodesWithNlines.toString()] || maxDefaultValue;
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
/*
diagramPadding: 20,
                            : '',
                            rankSpacing: 900,
                            nodeSpacing: 80
*/
upload.onclick = () => {
  const a = `TICKET_TYPE_PI`;
  const rankSpacing = getRankSpacing();
  /*const b = `
%%{ initialize: { "theme": 'forest', "flowchart": { "useMaxWidth": true, "diagramPadding": 20, "curve": 'basis' } } }%%
graph TB
vertical_restaurant((RESTAURANTE))

vertical_restaurant-->N1
vertical_restaurant-->N2
vertical_restaurant-->N3
N1-->N11((N11))
N1-->N12((N12))
N1-->N13((N13))
N1-->N14((N14))
N1-->N15((N15))
N1-->N16((N16))
N1-->N17((N17))
N11-->
N2-->N21((N21))
N2-->N22((N22))
N2-->N23((N23))
N2-->N24((N24))
N2-->N25((N25))
N2-->N26((N26))
N2-->N27((N27))
N11-->N111((N111))
N111-->N112((N112))
N112-->N113((N113))
N113-->N114((N114))
N114-->N115((N115))
N115-->N116((N116))
N116-->N117((N117))
`*/

  const b = `
%%{ initialize: { "theme": 'forest', "flowchart": { "useMaxWidth": true, "diagramPadding": 20, "curve": 'basis', "rankSpacing": ${rankSpacing}, "nodeSpacing": 100 } } }%%
graph TB
vertical_restaurant((RESTAURANTE))
style vertical_restaurant fill:transparent,stroke:#6816fc,stroke-width:4px,color:#6816fc,margin:10px
vertical_restaurant-->ticket_type_pi
vertical_restaurant-->ticket_type_tpd
vertical_restaurant-->ticket_type_pme
ticket_type_pi((${a})):::transactional-->product_type_product
ticket_type_pi:::transactional-->product_type_topping_with_price
ticket_type_pi:::transactional-->product_type_priceless_topping
ticket_type_pi:::transactional-->product_type_synthetic_main_topping
ticket_type_pi:::transactional-->product_type_synthetic_secondary_topping
ticket_type_pi:::transactional-->product_type_synthetic_beverage_topping
ticket_type_pi:::transactional-->product_type_synthetic_addition_topping
ticket_type_pi:::transactional-->product_type_napkin_topping
product_type_product([product_type_product]):::transactional-->first_iteration
product_type_product([product_type_product]):::transactional-->second_iteration
product_type_product([product_type_product]):::transactional-->third_iteration
first_iteration([first_iteration]):::transactional
second_iteration([second_iteration]):::transactional
third_iteration([third_iteration]):::transactional
product_type_topping_with_price([product_type_topping_with_price]):::transactional-->first_iteration
product_type_topping_with_price([product_type_topping_with_price]):::transactional-->second_iteration
product_type_topping_with_price([product_type_topping_with_price]):::transactional-->third_iteration
product_type_priceless_topping([product_type_priceless_topping]):::transactional-->first_iteration
product_type_priceless_topping([product_type_priceless_topping]):::transactional-->second_iteration
product_type_priceless_topping([product_type_priceless_topping]):::transactional-->third_iteration
product_type_synthetic_main_topping([product_type_synthetic_main_topping]):::transactional-->first_iteration
product_type_synthetic_main_topping([product_type_synthetic_main_topping]):::transactional-->second_iteration
product_type_synthetic_main_topping([product_type_synthetic_main_topping]):::transactional-->third_iteration
product_type_synthetic_secondary_topping([product_type_synthetic_secondary_topping]):::transactional-->first_iteration
product_type_synthetic_secondary_topping([product_type_synthetic_secondary_topping]):::transactional-->second_iteration
product_type_synthetic_secondary_topping([product_type_synthetic_secondary_topping]):::transactional-->third_iteration
product_type_synthetic_beverage_topping([product_type_synthetic_beverage_topping]):::transactional-->first_iteration
product_type_synthetic_beverage_topping([product_type_synthetic_beverage_topping]):::transactional-->second_iteration
product_type_synthetic_beverage_topping([product_type_synthetic_beverage_topping]):::transactional-->third_iteration
product_type_synthetic_addition_topping([product_type_synthetic_addition_topping]):::transactional-->first_iteration
product_type_synthetic_addition_topping([product_type_synthetic_addition_topping]):::transactional-->second_iteration
product_type_synthetic_addition_topping([product_type_synthetic_addition_topping]):::transactional-->third_iteration
product_type_napkin_topping([product_type_napkin_topping]):::transactional-->first_iteration
product_type_napkin_topping([product_type_napkin_topping]):::transactional-->second_iteration
product_type_napkin_topping([product_type_napkin_topping]):::transactional-->third_iteration
ticket_type_tpd([ticket_type_tpd]):::transactional-->product_type_product
ticket_type_tpd([ticket_type_tpd]):::transactional-->product_type_topping_with_price
ticket_type_tpd([ticket_type_tpd]):::transactional-->product_type_priceless_topping
ticket_type_tpd([ticket_type_tpd]):::transactional-->product_type_synthetic_main_topping
ticket_type_tpd([ticket_type_tpd]):::transactional-->product_type_synthetic_secondary_topping
ticket_type_tpd([ticket_type_tpd]):::transactional-->product_type_synthetic_beverage_topping
ticket_type_tpd([ticket_type_tpd]):::transactional-->product_type_synthetic_addition_topping
ticket_type_pme([ticket_type_pme]):::transactional-->product_temperature
ticket_type_pme([ticket_type_pme]):::transactional-->broke_spilled
ticket_type_pme([ticket_type_pme]):::transactional-->bad_packaged
ticket_type_pme([ticket_type_pme]):::transactional-->product_quality
product_temperature([product_temperature]):::transactional-->product_type_product
product_temperature([product_temperature]):::transactional-->product_type_topping_with_price
product_temperature([product_temperature]):::transactional-->product_type_priceless_topping
product_temperature([product_temperature]):::transactional-->product_type_synthetic_main_topping
product_temperature([product_temperature]):::transactional-->product_type_synthetic_secondary_topping
product_temperature([product_temperature]):::transactional-->product_type_synthetic_beverage_topping
product_temperature([product_temperature]):::transactional-->product_type_synthetic_addition_topping
broke_spilled([broke_spilled]):::transactional-->product_type_product
broke_spilled([broke_spilled]):::transactional-->product_type_topping_with_price
broke_spilled([broke_spilled]):::transactional-->product_type_priceless_topping
broke_spilled([broke_spilled]):::transactional-->product_type_synthetic_main_topping
broke_spilled([broke_spilled]):::transactional-->product_type_synthetic_secondary_topping
broke_spilled([broke_spilled]):::transactional-->product_type_synthetic_beverage_topping
broke_spilled([broke_spilled]):::transactional-->product_type_synthetic_addition_topping
bad_packaged([bad_packaged]):::transactional-->product_type_product
bad_packaged([bad_packaged]):::transactional-->product_type_topping_with_price
bad_packaged([bad_packaged]):::transactional-->product_type_priceless_topping
bad_packaged([bad_packaged]):::transactional-->product_type_synthetic_main_topping
bad_packaged([bad_packaged]):::transactional-->product_type_synthetic_secondary_topping
bad_packaged([bad_packaged]):::transactional-->product_type_synthetic_beverage_topping
bad_packaged([bad_packaged]):::transactional-->product_type_synthetic_addition_topping
product_quality([product_quality]):::transactional-->product_type_product
product_quality([product_quality]):::transactional-->product_type_topping_with_price
product_quality([product_quality]):::transactional-->product_type_priceless_topping
product_quality([product_quality]):::transactional-->product_type_synthetic_main_topping
product_quality([product_quality]):::transactional-->product_type_synthetic_secondary_topping
product_quality([product_quality]):::transactional-->product_type_synthetic_beverage_topping
product_quality([product_quality]):::transactional-->product_type_synthetic_addition_topping
classDef transactional fill:transparent,stroke:#ff441f,stroke-width:4px,color:#ff441f
`;
console.log("bbbbb", b);
    renderDiagram(/*`
          %%{ initialize: { "theme": 'forest', "flowchart": { "useMaxWidth": true, "diagramPadding": 20, "curve": 'basis', "rankSpacing": 200, "nodeSpacing": 80 } } }%%
          graph TB
            vertical_restaurant([restaurant])

            vertical_restaurant([restaurant])-->ticket_type_pi
            vertical_restaurant([restaurant])-->ticket_type_tpd
            vertical_restaurant([restaurant])-->ticket_type_pme
            ticket_type_pi([pi])-->product_type_product
            ticket_type_pi([pi])-->product_type_topping_with_price

      `*/b);
}

function createParentNode(parentId: string): Observable<Node[]> {
    return of(null).pipe(
        exhaustMap(() => createNode(parentId, 'parent')),
        exhaustMap((newNode: Node) => addNodeToTree(newNode, [])),
        tap((newNodesTree: Node[]) => setNodesTree(newNodesTree))
    );
}

(function() {
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        flowchart: {
            useMaxWidth: true
        }
    });
    const parentId: string = prompt('Seleccione nodo PADRE:');
    createParentNode(parentId).subscribe((nodesTree: Node[]) => initStartDiagram(nodesTree));
})();
