# Greccio 2026 · versión dinámica

Nueva versión, más actual e impactante, del christmas «El Fuego y la Ternura de Greccio» de la Parroquia Cristo de la Paz (Franciscanos de Carabanchel). Recorrido más corto: la vela de Greccio (1223) y, enseguida, la parroquia hoy hasta el Belén final. La puesta en escena es nueva:

- **Vuelo de entrada.** Al pulsar «Entrar» hay un destello y la cámara sale disparada desde lejos por el camino, con estelas de luz.
- **Viaje con estelas.** Entre escenas, el polvo de luz se estira, las estrellas se alargan y el camino brilla más. Con música suena un susurro de viento.
- **Llegada con destello.** Un barrido de brillo cruza la foto y una luz recorre su marco dorado. Las fotos tienen un zoom lento («fotos vivas») y una ligera inclinación 3D.
- **Texto cinético.** Las palabras entran una a una, del desenfoque a la nitidez. Detrás de cada texto hay una palabra o número gigante en contorno: I, Hoy, Fe, Vida, Ven.
- **Belén final.** Rayos de luz giratorios y una lluvia de chispas de oro. «¡Paz y Bien!» lleva un brillo dorado que recorre las letras.
- **Barra de progreso** dorada arriba.

---
# El Fuego y la Ternura de Greccio · christmas franciscano

Christmas de Navidad **para móvil**, hermano de [La Llegada del Mesías](../llegada-del-mesias):
un camino como el de georgedo.com: un hilo de luz dorada serpentea entre la bruma bajo un **cielo azul oscuro**,
con **la estrella de Belén en el centro** marcando el camino. Las imágenes esperan sobre el camino; al deslizar
avanzas hacia cada una, la atraviesas y sigues, **hasta llegar al Belén**.

## Escenas

| # | Escena | Imagen en el camino | Frase |
|---|--------|---------------------|-------|
| I | La noche fría | `img/01-vela.webp` · una vela en la piedra | «En la fría noche de 1223…» |
| P1 | Cristo de la Paz · Greccio hoy | `img/p-belen-viviente.webp` · el belén viviente en la parroquia | «Hoy, en el Cristo de la Paz…» |
| P3 | Cristo de la Paz · Una familia | `img/p-misa-ninos.webp` · misa con los niños | «Una comunidad que celebra…» |
| P4 | Cristo de la Paz · Un nuevo Greccio | `img/p-jovenes.webp` · niños y jóvenes con la pancarta | «Niños y jóvenes…» |
| P5 | Cristo de la Paz · Te esperamos | `img/p-fachada.webp` · la iglesia | «Esta Navidad, te esperamos…» |
| V | El deseo de Navidad | `img/05-portal.webp` · **el Portal de Belén**, más grande: la llegada | «¡Paz y Bien!» + firma + botones para enviarlo |

Cada voz en off va bajo su frase, en cursiva. Para cambiar una imagen, sustituye el archivo con el mismo nombre
(formato vertical, unos 768 × 1300 px).

## Publicar en GitHub Pages

1. Crea un repositorio nuevo, por ejemplo `greccio-fuego-ternura`.
2. Sube **el contenido** de esta carpeta a la rama `main`.
3. **Settings → Pages** → *Deploy from a branch* → `main` → `/ (root)`.
4. Estará en `https://TU-USUARIO.github.io/greccio-fuego-ternura/`. Ese es el enlace para enviar por WhatsApp.

## Estructura

```
index.html        las 5 escenas
404.html          página de error con el mismo estilo
css/style.css     tokens, tipografía (Cormorant Garamond + Jost) y maquetación móvil
js/main.js        umbral, música (audio/musica.mp3), voz de Álvaro por escena, enviar por WhatsApp
js/camino.js      el camino (canvas): cielo, estrella de Belén, hilo de luz, bruma y las imágenes
img/01…05-*.webp  imágenes de Greccio y el Belén final
img/p-*.webp      fotos de la Parroquia Cristo de la Paz (p-logo: logotipo en la firma)
audio/            musica.mp3 + voz-1…5.mp3 y voz-p1…p5.mp3 (voz de Álvaro) + generar_voz.py (ver LEEME.md)
img/og.jpg        imagen para la vista previa al compartir
```

## Notas

- **Recorrido automático:** al pulsar «Entrar con música» o «Entrar en silencio», el camino avanza solo y se detiene en cada escena mientras Álvaro la lee (7 s si no hay sonido); ante el Belén final, 6 s en silencio, y después sube el «¡Paz y Bien!» con la última locución. Tocar, deslizar o usar el teclado lo pausa; el botón ▶/❚❚ de arriba lo reanuda.

- Sin librerías ni 3D: funciona en cualquier móvil. Pesa ≈ 5 MB, casi todo la música.
- Al «Entrar con música», Álvaro lee cada escena cuando su texto queda en el centro; la música baja mientras habla.
- Para cambiar las curvas del camino: función `pathX` en `js/camino.js`; la separación entre imágenes: `SPACING`.
- Con «reducir movimiento» del sistema, sin parpadeos ni animaciones de luz.
- Para cambiar la firma: busca «Parroquia del Cristo de la Paz» en `index.html`.
- «Enviar este christmas» usa el menú de compartir del móvil; «Por WhatsApp» abre WhatsApp con el mensaje y el enlace.
