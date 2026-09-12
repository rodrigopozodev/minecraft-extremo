# Minecraft Extremo

Ejecuta `npm start` y abre http://localhost:3000. Requiere Node.js 22 o posterior y no necesita instalar dependencias.

Para entrar desde otros dispositivos de la misma red, utiliza `http://IP-DEL-EQUIPO:3000`. Para acceder por Internet, aloja este servidor Node en un servicio con almacenamiento persistente y configura su URL pública. Todos deben usar el mismo servidor para compartir el registro. Cualquier visitante puede añadir muertes, sin iniciar sesión.

Los jugadores son Degryh, David, Dani, Alexus y Pablo. David, Alexus y Degryh empiezan con una muerte sin fecha conocida. Cada nuevo clic guarda la fecha y hora del servidor; la web muestra la zona Europe/Madrid y se actualiza cada tres segundos. El registro permite ordenar de más reciente a más antiguo o al revés. Entre las muertes iniciales no se conoce el orden temporal.

Los datos se guardan en `data/deaths.json` y permanecen después de reiniciar. Conserva esa carpeta o una copia de seguridad. Puedes configurar `PORT` y `DATA_DIR` mediante variables de entorno. No ejecutes varias instancias sobre el mismo archivo de datos.
