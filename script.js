const telaInicial = document.getElementById("tela-inicial")
const telaCartelas = document.getElementById("tela-cartelas")
const telaJogo = document.getElementById("tela-jogo")
let imagemCentralBase64 = null

document
  .getElementById("imagemCentral")
  .addEventListener("change", function (event) {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = function (e) {
        imagemCentralBase64 = e.target.result
      }
      reader.readAsDataURL(file)
    }
  })

function mostrarCartelas() {
  telaInicial.classList.add("hidden")
  telaCartelas.classList.remove("hidden")
}

function mostrarJogo() {
  telaInicial.classList.add("hidden")
  telaJogo.classList.remove("hidden")
  iniciarJogo()
}

function voltar() {
  telaCartelas.classList.add("hidden")
  telaJogo.classList.add("hidden")
  telaInicial.classList.remove("hidden")
}

//Geração de Cartelas
function gerarCartelas() {
  const qtd = parseInt(document.getElementById("qtdCartelas").value)
  const preview = document.getElementById("preview")
  preview.innerHTML = ""

  for (let i = 0; i < qtd; i++) {
    preview.appendChild(criarCartela())
  }
  document.getElementById("btnPDF").classList.remove("hidden")
}

function criarCartela() {
  const colunas = {
    B: gerarNumeros(1, 15),
    I: gerarNumeros(16, 30),
    N: gerarNumeros(31, 45),
    G: gerarNumeros(46, 60),
    O: gerarNumeros(61, 75)
  }
  const div = document.createElement("div")
  div.classList.add("cartela")
  const tabela = document.createElement("table")

  const header = document.createElement("tr")
  for (let letra of ["B", "I", "N", "G", "O"]) {
    const th = document.createElement("td")
    th.innerText = letra
    header.appendChild(th)
  }
  tabela.appendChild(header)

  for (let i = 0; i < 5; i++) {
    const tr = document.createElement("tr")
    for (let letra of ["B", "I", "N", "G", "O"]) {
      const td = document.createElement("td")
      if (letra === "N" && i === 2) {
        td.classList.add("free")
        if (imagemCentralBase64) {
          const img = document.createElement("img")
          img.src = imagemCentralBase64
          td.appendChild(img)
        } else {
          td.innerText = "★"
        }
      } else {
        td.innerText = colunas[letra][i]
      }
      tr.appendChild(td)
    }
    tabela.appendChild(tr)
  }
  div.appendChild(tabela)
  return div
}

function gerarNumeros(min, max) {
  const nums = []
  while (nums.length < 5) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min
    if (!nums.includes(n)) nums.push(n)
  }
  return nums
}

async function gerarPDF() {
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const cartelas = document.querySelectorAll(".cartela")
  let x = 10,
    y = 10
  let count = 0

  for (let i = 0; i < cartelas.length; i++) {
    await doc.html(cartelas[i], {
      x: x,
      y: y,
      html2canvas: { scale: 0.3 }
    })
    x += 100
    count++
    if (count % 2 === 0) {
      x = 10
      y += 100
    }
    if (count % 4 === 0 && i < cartelas.length - 1) {
      doc.addPage()
      x = 10
      y = 10
    }
  }
  doc.save("cartelas.pdf")
}

// ------------------- Jogo -------------------
let pedras = []
let sorteadas = []

function iniciarJogo() {
  pedras = []
  sorteadas = []
  for (let i = 1; i <= 75; i++) pedras.push(i)
  document.getElementById("pedraAtual").innerText = "-"
  gerarTabelaJogo()
}

function gerarTabelaJogo() {
  const container = document.getElementById("tabela-jogo-container")
  container.innerHTML = ""
  const tabela = document.createElement("table")

  const header = document.createElement("tr")
  for (let letra of ["B", "I", "N", "G", "O"]) {
    const th = document.createElement("th")
    th.colSpan = 2
    th.innerText = letra
    th.classList.add("espaco-coluna")
    header.appendChild(th)
  }
  tabela.appendChild(header)

  for (let i = 0; i < 8; i++) {
    const tr = document.createElement("tr")
    for (let col = 0; col < 5; col++) {
      const inicio = col * 15 + 1
      const meio = inicio + 8
      let numeroEsq = i + inicio
      let numeroDir = i + meio

      const tdEsq = document.createElement("td")
      if (numeroEsq <= inicio + 7) {
        tdEsq.id = `num-${numeroEsq}`
        tdEsq.innerText = numeroEsq
      } else {
        tdEsq.innerText = ""
      }
      tr.appendChild(tdEsq)

      const tdDir = document.createElement("td")
      if (numeroDir <= inicio + 14) {
        tdDir.id = `num-${numeroDir}`
        tdDir.innerText = numeroDir
      } else {
        tdDir.innerText = ""
      }
      tr.appendChild(tdDir)

      if (col < 5) {
        tdDir.classList.add("espaco-coluna")
        tdEsq.classList.add("espaco-coluna")
      }
    }
    tabela.appendChild(tr)
  }
  container.appendChild(tabela)
}

function sortearPedra() {
  if (pedras.length === 0) {
    alert("Todas as pedras já foram sorteadas!")
    return
  }
  const idx = Math.floor(Math.random() * pedras.length)
  const numero = pedras.splice(idx, 1)[0]
  sorteadas.push(numero)

  const letra = getLetra(numero)
  document.getElementById("pedraAtual").innerText = letra + " - " + numero

  const celula = document.getElementById(`num-${numero}`)
  if (celula) celula.classList.add("sorteado")
}

function getLetra(num) {
  if (num <= 15) return "B"
  if (num <= 30) return "I"
  if (num <= 45) return "N"
  if (num <= 60) return "G"
  return "O"
}
