"use server";
import fs from "fs/promises";

export async function incrementVisits() {
  const filePath = "./visits.json";

  console.log("Intentando leer y actualizar el archivo..."); // Verifica si esto aparece en la consola del servidor
  let data;
  try {
    data = await fs.readFile(filePath, "utf-8");
  } catch (err) {
    // Si no existe el archivo, lo creamos con un contador inicial
    data = JSON.stringify({ count: 0 });
    await fs.writeFile(filePath, data);
  }

  const visitsData = JSON.parse(data);
  visitsData.count += 1;
  console.log("Nuevo contador de visitas:", visitsData.count); // Muestra el número actualizado

  await fs.writeFile(filePath, JSON.stringify(visitsData, null, 2));
  return visitsData.count;
}
