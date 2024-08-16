document.addEventListener('DOMContentLoaded', () => {
    const colorPalette = document.getElementById('color-palette');
    const colorSearch = document.getElementById('color-search');
    const searchForm = document.getElementById('search-form');
    const colorPreview = document.getElementById('color-preview');
    const hexValue = document.getElementById('hex-value');
    const rgbValue = document.getElementById('rgb-value');
    const cmykValue = document.getElementById('cmyk-value');
    const togglePaletteBtn = document.getElementById('toggle-palette');
    const colorPicker = document.getElementById('color-picker');
    const nearestXtermPreview = document.getElementById('nearest-xterm-preview');
    const nearestXtermValue = document.getElementById('nearest-xterm-value');

    let xtermColors = [];

    fetch('xterm-color.json')
        .then(response => response.json())
        .then(data => {
            xtermColors = data;
            generateColorPalette();
        })
        .catch(error => console.error('Error loading the color data:', error));

    const generateColorPalette = () => {
        colorPalette.innerHTML = '';
        xtermColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color.hex;
            swatch.addEventListener('click', () => updateColorDetails(color.hex));
            colorPalette.appendChild(swatch);
        });
    };

    // 色の詳細情報を更新
    const updateColorDetails = (color) => {
        const rgb = hexToRgb(color);
        const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
        rgbToXterm(rgb.r, rgb.g, rgb.b);
        const nearestXterm = findNearestXtermColor(rgb.r, rgb.g, rgb.b);

        colorPreview.style.backgroundColor = color;
        hexValue.textContent = `HEX: ${color}`;
        rgbValue.textContent = `RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}`;
        cmykValue.textContent = `CMYK: ${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`;
        // xtermValue.textContent = `xterm: ${xterm.xterm} (${xterm.name})`;

        nearestXtermPreview.style.backgroundColor = nearestXterm.hex;
        nearestXtermValue.textContent = `xterm: ${nearestXterm.xterm} (${nearestXterm.name})`;
    };

    // 最も近いxtermカラーを見つける
    const findNearestXtermColor = (r, g, b) => {
        let minDistance = Infinity;
        let nearestColor = null;

        for (const color of xtermColors) {
            const [cr, cg, cb] = color.rgb;
            const distance = Math.sqrt(
                Math.pow(r - cr, 2) +
                Math.pow(g - cg, 2) +
                Math.pow(b - cb, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestColor = color;
            }
        }

        return nearestColor;
    };

    // HEXからRGBに変換
    const hexToRgb = (hex) => {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    // RGBからHEXに変換
    const rgbToHex = (r, g, b) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    // RGBからCMYKに変換
    const rgbToCmyk = (r, g, b) => {
        let c = 1 - (r / 255);
        let m = 1 - (g / 255);
        let y = 1 - (b / 255);
        let k = Math.min(c, m, y);

        c = ((c - k) / (1 - k)) || 0;
        m = ((m - k) / (1 - k)) || 0;
        y = ((y - k) / (1 - k)) || 0;

        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    };

    // RGBからxtermカラーコードに変換
    const rgbToXterm = (r, g, b) => {
        return findNearestXtermColor(r, g, b);
    };

    // 入力された色を解析
    const parseColorInput = (input) => {
        // HEX
        if (input.match(/^#?([0-9A-F]{3}){1,2}$/i)) {
            return input.startsWith('#') ? input : `#${input}`;
        }

        // RGB (コンマ区切り)
        const rgbMatch = input.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
        if (rgbMatch) {
            const [, r, g, b] = rgbMatch.map(Number);
            if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                return rgbToHex(r, g, b);
            }
        }

        // 色名
        const namedColor = xtermColors.find(color => color.name.toLowerCase() === input.toLowerCase());
        if (namedColor) {
            return namedColor.hex;
        }

        return null;
    };

    // 検索フォームのイベントリスナー
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const colorInput = colorSearch.value.trim();
        const parsedColor = parseColorInput(colorInput);

        if (parsedColor) {
            updateColorDetails(parsedColor);
        } else {
            alert('有効な色形式を入力してください。\n例: "#FF0000", "255,0,0", "Red"');
        }
    });

    // パレット表示/非表示のトグル機能
    togglePaletteBtn.addEventListener('click', () => {
        colorPalette.classList.toggle('collapsed');
        const isCollapsed = colorPalette.classList.contains('collapsed');
        togglePaletteBtn.innerHTML = isCollapsed ?
            '<i class="fas fa-eye"></i> パレットを表示' :
            '<i class="fas fa-eye-slash"></i> パレットを非表示';
    });

    // カラーピッカーの変更イベントリスナー
    colorPicker.addEventListener('input', (event) => {
        const selectedColor = event.target.value;
        updateColorDetails(selectedColor);
    });
});