let backgroundColor;

function randomBlue() {
    // All the DO blues
    const blues = [
        "#0080FF",
        "#005FF8",
        "#023AAC",
        "#182765"
    ];
    return color(random(blues)).levels.slice(0, 3);
}

function hsp() {
    const [r, g, b, a] = backgroundColor.levels;
    // Thanks to https://awik.io/determine-color-bright-dark-using-javascript/
    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    return Math.sqrt(
        0.299 * (r * r) +
        0.587 * (g * g) +
        0.114 * (b * b)
    );
}

function isDark() {
    // Using the HSP value, determine whether the color is light or dark
    return hsp() <= 127.5;
}

function repeat(item, length) {
    return Array(length).fill(item);
}

function setup() {
    // Base canvas
    colorMode(RGB, 255, 255, 255, 1);
    const canvas = createCanvas(1500, 500, SVG);
    noLoop();

    // Ability to regenerate
    const btnNew = createButton('Generate New');
    btnNew.mousePressed(() => {
        clear();
        redraw();
    });

    // Ability to save as SVG
    const btnSvg = createButton('Save as SVG');
    btnSvg.mousePressed(() => {
        // Get SVG source
        const svg = canvas.svg;
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);

        // Add missing name spaces
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        // Blob & save
        const xml = '<?xml version="1.0" standalone="no"?>\r\n';
        var blob = new Blob([xml, source], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = 'header.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Ability to save as PNG
    const btnPng = createButton('Save as PNG');
    btnPng.mousePressed(() => {
        const cv = createGraphics(width, height);
        console.log(getDataURL());
        loadImage(getDataURL(), img => {
            cv.image(img, 0, 0);
            cv.save('header.png');
        })
    });
}

function draw() {
    // Create background
    setBackground('#fff');

    // SVGs
    new SVGs().create();

    // Waves
    new Waves().create();

    // Bubbles
    new Bubbles().create();

    // Ink noise
    const ink = new Ink();
    ink.dots();
    ink.blotches();
    ink.smudges();

    // Shine gradient
    //createGradient();
}

function setBackground(color) {
    backgroundColor = color;
    background(backgroundColor);
}

function createGradient() {
    // BG gradient
    const x = width * random(0.25, 0.75); // Middle half
    const y = height * random();
    const diameter = width * 2;

    let alpha = random(0, 0.25); // Edge
    const endAlpha = random(0.1, 0.25); // Middle
    const stepAlpha = (endAlpha - alpha) / diameter;

    let gradientColor = 255 * random([0.1, 0.9]); // Edge | Dark grey or light grey
    const endColor = 255 * random([0.1, 0.9]); // Middle | Dark grey or light grey
    const stepColor = (endColor - gradientColor) / diameter;

    smooth();
    noFill();
    strokeWeight(1);
    for (let d = diameter; d > 0; --d) {
        stroke(gradientColor, gradientColor, gradientColor, alpha);
        circle(x, y, d);
        gradientColor += stepColor;
        alpha += stepAlpha;
    }
}

class SVGs {

    assets(type, items) {
        return shuffle(Array(items).fill('').map((item, i) => {
            return `svg/${type}/${(i + 1).toString().padStart(2, '0')}.svg`;
        }));
    }

    createChat() {
        // Small chat on the top left
        const size = height * random(0.15, 0.3);
        this.draw(
            'svg/chat/01.svg',
            size, size,
            randomBlue(),
            random(0.1, 0.3),
            random(size, (width / 2) - size * 2),
            random(size, (height / 2) - size * 2)
        );
    }

    wheels() {
        return this.assets('wheels', 3);
    }

    createWheels() {
        // Big "ghost" wheel on the right
        const size = height * random(5 / 6, 5 / 3);
        this.draw(
            this.wheels().pop(),
            size, size,
            randomBlue(),
            random(0.05, 0.1),
            random(width / 2, width - (size * (2 / 3))), // Allow 1/3 to clip right
            random(0, height - (size * (2 / 3))) // Allow 1/3 to clip bottom
        );
    }

    rings() {
        return this.assets('rings', 2);
    }

    createItems() {
        const items = shuffle([...this.wheels(), ...this.rings()]);
        let size;

        // Small item on the bottom left
        size = height * random(0.15, 0.5);
        this.draw(
            items.pop(),
            size, size,
            randomBlue(),
            random(0.1, 0.3),
            random(0, (width / 2) - size),
            random(height / 2, height - size)
        );

        // Small item on the right
        size = height * random(0.1, 0.3);
        this.draw(
            items.pop(),
            size, size,
            randomBlue(),
            random(0.1, 0.3),
            random(width / 2, width - size),
            random(0, height - size)
        );
    }

    create() {
        this.createChat();
        this.createWheels();
        this.createItems();
    }

    draw(path, width, height, color, alpha, x, y) {
        loadSVG(path, svg => {
            // Size
            svg.width = width;
            svg.height = height;

            // Color
            let g = svg.elt;
            while (g.querySelector('g')) g = g.querySelector('g');
            if (g.hasAttribute('fill')) g.setAttribute('fill', `rgba(${color.join(', ')}, ${alpha})`);
            if (g.hasAttribute('stroke')) g.setAttribute('stroke', `rgba(${color.join(', ')}, ${alpha})`);

            // Render
            image(svg, x, y, width, height, x, y, width, height);
            // TODO: It'd be cool if we can rotate these but currently that breaks positions with stacking
            // TODO: Maybe use createGraphics at same size as the main and rotate in that to avoid the stacking issues?
        });
    }
}

class Ink {

    dots() {
        const dots = round(random(10, 30));
        for (let i = 0; i < dots; i++) {
            const color = 255 * random(0.1, 0.5);
            this.dot(
                random() * width,
                random() * height,
                random(0.05, 1.5),
                color
            )
        }
    }

    dot(x, y, size, color) {
        smooth();
        noStroke();
        fill(color, color, color, random(0.15, 0.5));
        circle(x, y, size);
    }

    blotches() {
        const blotches = round(random(0, 10));
        for (let i = 0; i < blotches; i++) {
            const color = 255 * random([0.2, 0.8]); // Dark grey or light grey
            smooth();
            noStroke();
            fill(color, color, color, random(0.3, 0.5));
            beginShape();
            const x = random() * width;
            const y = random() * height;
            const wobble = random(1, 2.5);
            const vertexes = random(4, 9);
            for (let j = 0; j < vertexes; j++) {
                curveVertex(x + random(-wobble, wobble), y + random(-wobble, wobble));
            }
            endShape();

            // Additional dots around
            if (round(random(1, 3)) === 1) {
                const dots = round(random(5, 15));
                const wobbleScale = random(5, 10);
                for (let i = 0; i < dots; i++) {
                    this.dot(
                        x + random(-wobble * wobbleScale, wobble * wobbleScale),
                        y + random(-wobble * wobbleScale, wobble * wobbleScale),
                        random(0.5, 1.5),
                        color
                    )
                }
            }
        }
    }

    smudges() {
        const smudges = round(random(0, 5));
        for (let i = 0; i < smudges; i++) {
            const color = 255 * random([0.1, 0.9]); // Dark grey or light grey
            smooth();
            noStroke();
            fill(color, color, color, random(0.2, 0.3));
            beginShape();
            const x = random() * width;
            const y = random() * height;
            const wobble = random(4, 8);
            const vertexes = random(4, 6);
            for (let j = 0; j < vertexes; j++) {
                curveVertex(x + random(-wobble / 2, wobble / 2), y + random(-wobble, wobble)); // Y bias in wobble
            }
            endShape();
        }
    }
}

class Bubbles {

    create() {
        const maxColumns = 4;
        const columns = round(random(maxColumns / 2, maxColumns));
        const order = shuffle(('1'.repeat(columns) + '0'.repeat(maxColumns - columns)).split('').map(i => parseInt(i)));
        const counts = [
            [2, 5],
            [3, 6],
            [4, 8]
        ];
        const sizes = [
            [
                [5, 10],
                [25, 40]
            ],
            [
                [5, 10],
                [35, 50]
            ]
        ];

        for (let i = 0; i < maxColumns; i++) {
            if (order[i]) {
                const count = random(counts);
                const size = random(sizes);
                const start = width * (i * (1 / (maxColumns + 1)));
                const end = width * ((i + 1) * (1 / (maxColumns + 1)));
                this.draw(
                    round(random(...count)),
                    random(...size[0]),
                    random(...size[1]),
                    random(start, end)
                );
            }
        }
    }

    draw(count, minSize, maxSize, xStart) {
        // Draw setup
        const color = randomBlue();
        const weight = random(1, 1.5);
        smooth();
        noFill();
        stroke(...color, 1);
        strokeWeight(weight);

        // Make bubbles
        const spacing = max(1, random(-6, 6)); // Bias towards 1
        let lastSize = maxSize;
        let lastY = maxSize * random(0.5, 0.7);
        for (let i = 0; i < count; i++) {
            noFill();
            const bubblesLeft = count - i;
            const allocatedDelta = (lastSize - minSize) / bubblesLeft;
            lastSize -= random(allocatedDelta * 0.75, allocatedDelta);
            lastY -= lastSize + random(allocatedDelta * spacing * 0.75, allocatedDelta * spacing * 1.25);
            circle(xStart + random(-lastSize, lastSize) / 2, height + lastY, lastSize);
        }

        // TODO: some bubbles could have a cartoon shine line
    }
}

class Waves {

    create() {
        // Waves
        let minWidth, maxWidth, waveHeight, waves;

        // Small waves (top half)
        minWidth = width * 0.1;
        maxWidth = width * 0.2;
        waveHeight = random(height * 0.02, height * 0.03);
        waves = round(random(2, 5));
        this.group(
            minWidth,
            maxWidth,
            waveHeight,
            random(4, 6),
            waves,
            random(0, width - maxWidth),
            function () {
                return random(width * -0.05, width * 0.05)
            },
            random(waveHeight * 2, height / 2 - 1.5 * waveHeight * waves)
        );

        // Big waves (bottom half)
        minWidth = width * 0.4;
        maxWidth = width * 0.6;
        waveHeight = random(height * 0.04, height * 0.08);
        waves = round(random(2, 3));
        this.group(
            minWidth,
            maxWidth,
            waveHeight,
            random(2, 4),
            waves,
            random(0, width - maxWidth),
            function () {
                return random(width * -0.1, width * 0.1)
            },
            random(height / 2, height - 1.5 * waveHeight * waves)
        );
    }

    group(minWidth, maxWidth, waveHeight, peaks, waves, xStart, xRandom, yStart) {
        const period = ((minWidth + maxWidth) / 2) / peaks;
        const color = 255 * random(0.7, 1);
        const alpha = random(0.7, 1);
        const weight = max(1, random(0.5, 3)); // Bias towards 1
        for (let i = 0; i < waves; i++) {
            this.draw(
                period,
                waveHeight / 2,
                random(minWidth, maxWidth),
                xStart + xRandom(),
                yStart + i * waveHeight * 1.5,
                color,
                alpha,
                weight
            );
        }

        // TODO: A group of waves might have glow-y shadow
        // TODO: A group of waves might have drop shadow
    }

    draw(period, amplitude, width, xStart, yStart, color, alpha, weight) {
        // Generate
        const yvalues = [];
        let x = TWO_PI * (xStart / period);
        for (let i = 0; i < width; i++) {
            yvalues.push(sin(x) * amplitude);
            x += TWO_PI / period;
        }

        // Draw
        smooth();
        noFill();
        stroke(color, color, color, alpha);
        strokeWeight(weight);
        beginShape();
        for (let x = 0; x < yvalues.length; x++) {
            curveVertex(x + xStart, yvalues[x] + yStart);
        }
        endShape();
    }
}
