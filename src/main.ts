import mermaid from "mermaid";

mermaid.initialize({
    startOnLoad: true,
    theme: 'forest',
    flowchart: {
        useMaxWidth: true,
        diagramPadding: 15,
        nodeSpacing: 20
    }
});

const mermaidDiagram = document.getElementById('mermaid-diagram');
mermaidDiagram.innerHTML = `
    graph TB
        A((Nodo A))-->B((Nodo B))
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
`;