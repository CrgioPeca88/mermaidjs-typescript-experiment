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
let treeValidate: HTMLElement;
let updateParent: HTMLElement;
let upload: HTMLElement;
let count: number;
let startDiagram: string;
let tree: string;

(function () {
    count = 1;
    startDiagram = `
        graph TB
            subgraph vertical[Padres - Initials]
                1((Nodo 1))
            end vertical
    `;
    tree = startDiagram;
    mermaidDiagram = document.getElementById('mermaid-diagram');
    addNode = document.getElementById('addNode');
    clear = document.getElementById('clear');
    treeValidate = document.getElementById('treeValidate');
    updateParent = document.getElementById('updateParent');
    upload = document.getElementById('upload');
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

function callback(): void {
    alert("Hola!!");
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
            end childs
    `);
}