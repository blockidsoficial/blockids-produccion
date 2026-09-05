const fs = require('fs');
const path = require('path');

// Rutas de origen y destino
const sourceFile = path.join(__dirname, '../src/components/green-flag/icon--green-flag.svg');
const destinationFile = path.join(__dirname, '../node_modules/scratch-blocks/media/green-flag.svg');

try {
  // Leer el archivo de origen
  const fileContent = fs.readFileSync(sourceFile, 'utf8');
  
  // Escribir el archivo en el destino
  fs.writeFileSync(destinationFile, fileContent, 'utf8');
  
  console.log('Bandera personalizada parcheada exitosamente en scratch-blocks');
} catch (error) {
  console.warn(`No se pudo parchear la bandera personalizada: ${error.message}`);
  console.warn('Continuando con la instalación...');
}
