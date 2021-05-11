import mermaid from "mermaid";

/*type NodeType = 'parent' | 'child'

interface NodeChild {
    name: string;
}

interface Node {
    id: string
    name: string;
    type: NodeType;
    roads: NodeChild[]
}*/

let mermaidDiagram: HTMLElement;
let clear: HTMLElement;
let addNode: HTMLElement;
let count: number;
let startDiagram: string;
let tree: string;

(function () {
    count = 1;
    startDiagram = `
        graph TB
            subgraph vertical[Padres]
                1((Nodo 1))
            end
    `;
    tree = startDiagram;
    mermaidDiagram = document.getElementById('mermaid-diagram');
    addNode = document.getElementById('addNode');
    clear = document.getElementById('clear');
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
})()

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
    if (getCounter() > 1) {
        tree =`
            ${tree}\n
            subgraph childs[Hijos]
            ${newNode}
            end
        `;
    } else {
        tree.replace(`end`, `${newNode}\n end`);
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