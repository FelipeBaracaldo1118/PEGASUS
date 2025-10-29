// Pegamos el bloque de datos como texto
const dataText = `
PS4	Base Kit	CSVProfile		Buenos Aires
PS4	Base Kit	CSVProfile		Bogota
PS4	Base Kit	CSVProfile		Bogota
PS4	Base Kit	CSVProfile		Bogota
PS4	Base Kit	CSVProfile		Buenos Aires
PS4	Base Kit	CSVProfile		Bogota
PS4	Base Kit	CSVProfile		Bogota
PS4	Base Kit	CSVProfile		Buenos Aires
PS4	Base Kit	CSVProfile		Cordoba
PS4	Base Kit	CSVProfile		Cordoba
PS4	Base Kit	CSVProfile		Cordoba
PS4	Base Kit	CSVProfile		Cordoba
PS4	Base Kit	CSVProfile		Cordoba
PS4	Base Kit	CSVProfile		Cordoba
PS4	Base Kit	CSVProfile		Buenos Aires
PS4	Base Kit	CSVProfile		Buenos Aires
PS4	Base Kit	CSVProfile	Splitscreen	Cordoba
PS4	Pro Test Kit	CSVProfile		Cordoba
PS4	Dev Kit	LWM	Bogota
PS4	Dev Kit	Razor		Cordoba
PS4	Dev Kit	LLM		Bogota
PS5	Pro Kit 	CSVProfile	120Hz	Cordoba
PS5	Test Kit	CSVProfile		Buenos Aires
PS5	Test Kit	CSVProfile		Bogota
PS5	Pro Kit	CSVProfile		Bogota
PS5	Test Kit	CSVProfile	120 HZ	Cordoba
PS5	Test Kit	CSVProfile	Splitscreen	Cordoba
XB1	Base Test Kit (Brazil Test Center Temp)	CSVProfile		EPIC
XB1	XboxOne X (Brazil Test Center Temp)	CSVProfile		EPIC
XB2	XboxOne X (Brazil Test Center Temp)	CSVProfile		EPIC
XSX	Anaconda	LLM		Cordoba
XSX	Anaconda	CSVProfile	120Hz	Buenos Aires
XSX	Anaconda	CSVProfile	Splitscreen	Cordoba
XSX	Anaconda			Cordoba
XSX	Lockhart	LLM		Bogota
XSX	Lockhart	CSVProfile		Buenos Aires
XSX	Lockhart	CSVProfile		Bogota
XSX	Lockhart	CSVProfile	120Hz	Bogota
XSX	Lockhart	CSVProfile	Splitscreen	Cordoba
XSX	Lockhart	DevBuild		Cordoba
Switch	Docked - OLED	LWM	Buenos Aires
Switch	Docked	CSVProfile		Buenos Aires
Switch	Docked	CSVProfile		Buenos Aires
Switch	Docked - OLED	Trace		Cordoba
Switch	Docked	CSVProfile		Buenos Aires
Switch	Docked	CSVProfile		Buenos Aires
Switch	Docked	CSVProfile		Cordoba
Switch	Undocked	CSVProfile		Cordoba
Switch	Undocked	CSVProfile		Cordoba
Switch	Undocked	CSVProfile		Cordoba
Switch	Undocked	CSVProfile		Bogota
Switch	Undocked	CSVProfile		Bogota
Switch	Undocked	CSVProfile		Bogota
Switch	Undocked	CSVProfile		Bogota
Switch	Docked - OLED	Trace		Bogota
Switch	Docked - OLED	LLM		Cordoba
Switch	Docked - OLED	LLM		Cordoba
Switch	Docked - OLED	LLM		Cordoba
PC	Desktop Epic-1	DX12	CSVProfile	Buenos Aires
PC	Desktop Epic-1	DX12	CSVProfile	Bogota
PC	Desktop Epic-1	DX12	CSVProfile	Bogota
PC	Desktop Epic-1	DX12	Trace	Cordoba
PC	Desktop Epic-1	DX12	CSVProfile	Cordoba
PC	Desktop Epic-1	DX12	CSVProfile	Buenos Aires
PC	Desktop Epic-1	DX12	CSVProfile	Cordoba
PC	Desktop Epic-1	DX12	CSVProfile	Cordoba
PC	Desktop Recommended - 2	DX12	CSVProfile	Bogota
PC	Desktop Recommended - 2	DX12	CSVProfile	Bogota
PC	Desktop Recommended - 2	DX12	CSVProfile	Bogota
PC	Desktop Recommended - 2	DX12	CSVProfile	Cordoba
PC	Laptop Recommended -1 	DX12	CSVProfile	Cordoba
PC	Laptop Recommended -2	DX12	CSVProfile	Buenos Aires
PC	Laptop Recommended -1 	Performance 	CSVProfile	Buenos Aires
PC	Desktop Epic-1	Performance 	CSVProfile	Buenos Aires
PC	Laptop Recommended -2	Performance 	CSVProfile	Bogota
PC	Laptop Recommended -1 	Performance 	CSVProfile	Bogota
Android	Samsung Galaxy S9	Trace		Cordoba
Android	Samsung Galaxy S21 FE	CSVProfile		Cordoba
Android	Samsung Galaxy S21 FE	CSVProfile		Buenos Aires
Android	Samsung S20 Ultra Mali	CSVProfile		Bogota
Android	Xiaomi Redmi Note 8 Pro	CSVProfile		Bogota
iOS	iPhone 11	CSVProfile		Bogota
iOS	iPhone 11	CSVProfile		Buenos Aires
iOS	iPhone 12	CSVProfile		Buenos Aires
iOS	iPhone 12	CSVProfile		Bogota
iOS	iPhone 13	CSVProfile		Cordoba
iOS	iPhone 15 Pro	Trace		Bogota
iOS	iPhone 15 Pro	CSVProfile		Bogota
iOS	iPhone 16	CSVProfile		Cordoba
iOS	iPhone 13	CSVProfile		Buenos Aires
iOS	iPhone 13	CSVProfile		Cordoba
iOS	iPhone 12	CSVProfile		Cordoba
iOS	iPhone 12	CSVProfile		Cordoba
iOS	iPhone 16	LLM		Cordoba
iPAD	iPad mini (6th Gen)	LLM		Bogota
iPAD	iPad Air 5	CSVProfile		Bogota

`;

// Función para procesar los datos
function countCapturesForBogota(dataText) {
  const lines = dataText.trim().split("\n");
  const bogotaLines = lines.filter(line => line.toLowerCase().includes("bogota"));

  const counts = {};

  bogotaLines.forEach(line => {
    const parts = line.split("\t").map(p => p.trim()).filter(Boolean);
    const device = parts[0];
    const captureType = parts[2] || "SinTipo";

    if (!counts[device]) {
      counts[device] = {};
    }
    if (!counts[device][captureType]) {
      counts[device][captureType] = 0;
    }
    counts[device][captureType]++;
  });

  // Mostrar resultados
  console.log("📊 Capturas en Bogotá por dispositivo y tipo:");
  Object.keys(counts).forEach(device => {
    const total = Object.values(counts[device]).reduce((a, b) => a + b, 0);
    console.log(`\n${device} (total: ${total})`);
    Object.entries(counts[device]).forEach(([type, cnt]) => {
      console.log(`   ${type}: ${cnt}`);
    });
  });
}

countCapturesForBogota(dataText);