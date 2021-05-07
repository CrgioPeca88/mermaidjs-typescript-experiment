import mermaid from "mermaid";

let mermaidDiagram: HTMLElement;
let startButton: HTMLElement;
let graph2: HTMLElement;
let addNode: HTMLElement;
let count: number;
let testDiagram: string;

(function () {
    count = 2;
    testDiagram = `
        graph TB
            subgraph Padres
                1((Nodo 1))
            end
            subgraph Hijos
                1-->2((Nodo 2))
            end
    `;
    mermaidDiagram = document.getElementById('mermaid-diagram');
    startButton = document.getElementById('start');
    graph2 = document.getElementById('graph2');
    addNode = document.getElementById('addNode');
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        flowchart: {
            useMaxWidth: false,
            diagramPadding: 15,
            nodeSpacing: 20
        }
    });
})()

function getDiagram(): string {
    return `
    graph TB
        subgraph Zona1
            A((Nodo A))
        end
        subgraph Zona2
            A-->B((Nodo B))
            B-->C((Nodo C))
            C-->D((Nodo D))
            D-->E((Nodo E))
            E-->F((Nodo F))
            F-->G((Nodo G))
            G-->H((Nodo H))
            A-->C
            A-->D
            A-->E
            A-->F
            A-->G
            A-->H
            A-->I((Nodo I))
            A-->J((Nodo J))
            A-->K((Nodo K))
            A-->L((Nodo L))
            A-->M((Nodo M))
            A-->N((Nodo N))
            A-->Ñ((Nodo Ñ))
            A-->O((Nodo O))
            A-->P((Nodo P))
            A-->Q((Nodo Q))
            A-->R((Nodo R))
            A-->S((Nodo S))
            A-->T((Nodo T))
        end
    `;
}

function getGrafo(): string {
    return testDiagram;
}

function setGrafo(newNode: String): void {
    testDiagram =`${testDiagram}\n${newNode}`;
}

function renderDiagram(diagram: string): void {
    mermaid.render("mermaid-diagram-svg", diagram, (svgCode) => {
        mermaidDiagram.innerHTML = svgCode;
    });
}

startButton.onclick = () => {
    renderDiagram(getDiagram());
}

graph2.onclick = () => {
    renderDiagram(getGrafo());
}

addNode.onclick = () => {
    count++;
    setGrafo(`1-->${count}((Nodo ${count}))`);
    renderDiagram(getGrafo());
}
