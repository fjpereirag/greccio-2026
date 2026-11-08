# Genera las locuciones del christmas «El Fuego y la Ternura de Greccio» con la voz de Álvaro (es-ES-AlvaroNeural).
# Uso: python generar_voz.py   (crea voz-1.mp3 … voz-5.mp3 en esta carpeta)
import asyncio, subprocess, sys, os

try:
    import edge_tts
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "edge-tts"])
    import edge_tts

VOZ = "es-ES-AlvaroNeural"
TEXTOS = [
    "En la fría noche de mil doscientos veintitrés, en un rincón llamado Greccio, san Francisco quiso ver con sus propios ojos "
    "la incomodidad y la pobreza en la que nació el Hijo de Dios. ... Un asombro que encendió la historia.",
    "No hubo oro ni grandezas. Solo paja, un buey, un asno... y el fuego vivo del amor divino. ... "
    "Francisco no buscó recordar el pasado con nostalgia, sino hacerlo presente.",
    "Dios se despojó de todo poder y se hizo un Niño frágil. En la humildad del pesebre descubrimos la verdadera grandeza del amor. ... "
    "El Creador del universo eligió el barro para hacerse nuestro hermano.",
    "El Niño de Belén no es solo un recuerdo; es el Dios con nosotros, que hoy vuelve a nacer si le abrimos la puerta de nuestro corazón. ... "
    "Hagamos de nuestra vida un nuevo Greccio: un lugar sencillo donde Jesús pueda nacer hoy.",
    "¡Paz y Bien! Que la luz del portal de Belén ilumine tus pasos, y la sencillez del Poverello inspire cada día del nuevo año. ... "
    "¡Feliz Navidad franciscana!",
]

async def main():
    carpeta = os.path.dirname(os.path.abspath(__file__))
    for i, texto in enumerate(TEXTOS, 1):
        destino = os.path.join(carpeta, f"voz-{i}.mp3")
        await edge_tts.Communicate(texto, VOZ, rate="-8%", pitch="-2Hz").save(destino)
        print("OK", destino)
    print("LISTO")

asyncio.run(main())
