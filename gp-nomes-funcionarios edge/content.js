// Mapa Usuário -> Funcionário
const mapa = {
  //Administrativo 
  "administrativo_01": "LUIZ ALBERTO MOREIRA DOS SANTOS",
  "administrativo_02": "RICHARD SELVA SOHN",
  "administrativo_03": "LOHAN CADILHE POLLETTI CHAGAS",
  "administrativo_04": "MATHEUS CARLOS DE REZENDE DA SILVA",
  //Atendente Loja
  "atendente-loja_01": "ANA CAROLINA SILVA MEDAS",
  "atendente-loja_02": "VIVIAN CAMPOS PEREIRA",
  "atendente-loja_03": "JOSELAINE SOARES DA SILVA REIS",
  "atendente-loja_04": "GABRIELE LOPES DO AMARAL",
  //Auxiliar de Supervisão
  "aux.superv_financeiro": "BRUNA DA SILVA FURTADO",
  //Financeiro
  "financeiro_01": "LUANA DE OLIVEIRA DA CONCEIÇÃO",
  "financeiro_02": "TAYARA DE MORAES CAVALCANTE",
  "financeiro_03": "BARBARA DE ALMEIDA MEDAS",
  //RH
  "superv_rh": "ALESSANDRA DA SILVA SOUZA",
  //Supervisor Técnico
  "superv_tecnico": "BRUNO PINHEIRO DE LIMA",
  "superv_tecnico.infra": "WILLIAN REZENDE THEODORO DIAS",
  //Suporte
  "suporte_01": "JEFFERSON JANUARIO LIMA",
  "suporte_02": "HELIO HENRIQUE PINHEIRO BERNARDO",
  "suporte_03": "IGOR MAGALHAES VICTOR",
  "suporte_04": "DIEGO COSTA DE REZENDE GOMES",
  "suporte_05": "VICTOR HENRIQUE DE OLIVEIRA",
  "suporte_06": "WILLIAM DE OLIVEIRA SILVA",
  "suporte_07": "LUCAS DE JESUS VERISSIMO",
  "suporte_08": "DAVI ROCHA DE ARRUDA",
  //Técnico
  "tecnico_01": "CARLOS ALBERTO BOTELHO",
  "tecnico_02": "ADEMIR DA SILVA REZENDE",
  "tecnico_03": "GABRIEL MOTTA DE OLIVEIRA NETTO",
  "tecnico_04": "IGOR GONÇALVES DE ANDRADE",
  "tecnico_05": "ANDERSON FABRICIO DE OLIVEIRA",
  "tecnico_06": "RICHARD ARAUJO DA SILVA LEITE",
  "tecnico_07": "GABRIEL CONCEIÇÃO PEREIRA",
  "tecnico_08": "PEDRO HENRIQUE DE OLIVEIRA",
  "tecnico_09": "WALACE JOSE DOS ANJOS",
  "tecnico_10": "LUIZ TIAGO GONÇALVES DA VITORIA",
  "tecnico_11": "PAULO STEFFANO BELARMINO",
  "tecnico_12": "WELLINGTON LEAL DE BRITO",
  "tecnico_13": "FLAVIO SILVEIRA MACIEL",
  "tecnico_14": "LEANDRO FILHO DOS SANTOS",
  "tecnico_15": "MARLON FERREIRA LAGOAS REIS",
  "tecnico_16": "SONY VIEIRA FERNANDES",
  "tecnico_17": "DIEGO DE OLIVEIRA PEREIRA",
};

const ignorarTags = ["SCRIPT", "STYLE", "TEXTAREA", "INPUT"];

function substituirNoTexto(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    let texto = node.nodeValue;
    let alterou = false;

    Object.keys(mapa).forEach((usuario) => {
      if (texto.includes(usuario)) {
        const nome = mapa[usuario];
        const re = new RegExp(usuario, "g");
        texto = texto.replace(re, nome);
        alterou = true;
      }
    });

    if (alterou) {
      node.nodeValue = texto;
    }
  } else if (node.nodeType === Node.ELEMENT_NODE && !ignorarTags.includes(node.tagName)) {
    for (let i = 0; i < node.childNodes.length; i++) {
      substituirNoTexto(node.childNodes[i]);
    }
  }
}

// roda na carga da página
substituirNoTexto(document.body);

// opcional: observar mudanças dinâmicas (AJAX, navegação interna do SGP)
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      substituirNoTexto(node);
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
