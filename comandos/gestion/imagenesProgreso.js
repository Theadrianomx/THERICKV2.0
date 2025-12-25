// comandos/gestion/imagenesProgreso.js

// Definir todas las imágenes
const imagenes = {
  minar: [
    'https://i.postimg.cc/T12rTnzQ/s-l1200.jpg',
    'https://i.postimg.cc/xyz123/otra.jpg'
  ],
  hierro: [
    'https://i.postimg.cc/QdYwH97G/Picsart-25-12-02-00-18-29-637.png'
  ],
  oro: [
    'https://i.postimg.cc/0y0hxXk2/Picsart-25-12-02-00-10-48-161.png'
  ],
  diamante: [
    'https://i.postimg.cc/GpY8HDfG/Picsart-25-12-02-00-14-08-935.png'
  ],
  esmeralda: [
    'https://i.postimg.cc/Y9CHJKQ4/Picsart-25-12-02-00-15-41-665.png'
  ]
};

// Obtener una imagen aleatoria de un tipo (por defecto 'minar')
export function getRandomImg(tipo = 'minar') {
  const imgs = imagenes[tipo] || imagenes['minar'];
  return imgs[Math.floor(Math.random() * imgs.length)];
}

// Obtener una imagen específica para un material
export function getImgForMaterial(material) {
  const imgs = imagenes[material] || [imagenes['minar'][0]];
  return imgs[Math.floor(Math.random() * imgs.length)];
}

// Resultados de minería al azar (opcional)
export const resultadosMinar = [
  { nombre: "Piedra", xp: 10 },
  { nombre: "Oro", xp: 20 },
  { nombre: "Diamante", xp: 50 },
];