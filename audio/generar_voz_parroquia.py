# Voces de Álvaro para las escenas de la Parroquia Cristo de la Paz (christmas «El Fuego y la Ternura de Greccio»).
import asyncio, subprocess, sys, os
try:
    import edge_tts
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "edge-tts"]); import edge_tts
TEXTOS = {
    "voz-p1": "Hoy, en el Cristo de la Paz, niños y mayores vuelven a hacer presente el Belén, como Francisco en Greccio.",
    "voz-p2": "Ante el altar, el saludo de Francisco lo resume todo: Paz y Bien.",
    "voz-p3": "Una comunidad que celebra, acoge, y transmite la fe a los más pequeños.",
    "voz-p4": "Niños y jóvenes que quieren hacer de su vida un nuevo Greccio.",
    "voz-p5": "Esta Navidad, te esperamos en la Parroquia Cristo de la Paz. Franciscanos de Carabanchel.",
}
async def main():
    c = os.path.dirname(os.path.abspath(__file__))
    for k, t in TEXTOS.items():
        await edge_tts.Communicate(t, "es-ES-AlvaroNeural", rate="-8%", pitch="-2Hz").save(os.path.join(c, k + ".mp3")); print("OK", k)
    print("LISTO")
asyncio.run(main())
