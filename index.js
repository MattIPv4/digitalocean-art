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

function randomWeight() {
    return random(1.5, 2);
}

function randomOrder(minColumns, maxColumns, totalColumns) {
    const columns = round(random(minColumns, maxColumns));
    return shuffle(('1'.repeat(columns) + '0'.repeat(totalColumns - columns)).split('').map(i => parseInt(i)));
}

function randomColumns(columns, order, callback) {
    for (let i = 0; i < columns; i++) {
        if (order[i]) {
            const start = width * (i * (1 / (columns + 1)));
            const end = width * ((i + 1) * (1 / (columns + 1)));
            callback(start, end);
        }
    }
}

function randomBool() {
    return round(random()) === 0;
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
    const canvas = createCanvas(1600, 400, SVG);
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

    // Top/bottom of ocean
    const top = random([true, false]);

    // SVGs
    new SVGs().create(top);

    // Waves
    const waves = new Waves();

    // Horizontal waves
    waves.createAllHorizontal(top);

    // Vertical columns
    if (!top) {
        const order = randomOrder(2, 4, 5);
        const bubbleOrder = Array(5).fill(0);
        const waveOrder = Array(5).fill(0);
        order.forEach((val, i) => {
            if (val) {
                if (randomBool()) bubbleOrder[i] = 1;
                else waveOrder[i] = 1;
            }
        });
        new Bubbles().create(5, bubbleOrder);
        waves.createAllVertical(5, waveOrder);
    }

    // Ink noise
    //const ink = new Ink();
    //ink.dots();
    //ink.blotches();
    //ink.smudges();

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

    wheels() {
        return this.assets('wheels', 3);
    }

    createWheels() {
        const wheels = this.wheels();
        let size;

        // Big "ghost" wheel on the right
        size = height * random(0.9, 1.6);
        let x;
        if (randomBool()) x = random(-size * (1 / 3), width * (1 / 3) - size); // Allow 1/3 to clip left
        else x = random(width * (2 / 3), width - (size * (2 / 3))); // Allow 1/3 to clip right
        this.draw(
            wheels.pop(),
            size, size,
            randomBlue(),
            random(0.05, 0.1),
            x,
            random(0, height - (size * (2 / 3))) // Allow 1/3 to clip bottom
        );

        // Small "buried" wheel on the bottom
        size = height * random(0.15, 0.5);
        this.draw(
            wheels.pop(),
            size, size,
            randomBlue(),
            random(0.2, 0.4),
            random(0, width - size),
            random(height - (size * (2 / 3)), height - (size * (1 / 3))) // Allow 1/3 - 2/3 to clip bottom
        );
    }

    plants() {
        return this.assets('plants', 2);
    }

    createPlants() {
        const thisClass = this;
        randomColumns(4, randomOrder(1, 3, 4), function (start, end) {
            const size = height * random(0.15, 0.3);
            thisClass.draw(
                thisClass.plants().pop(),
                size, size,
                randomBlue(),
                random(0.4, 0.8),
                random(start, end),
                height - size
            );
        });
    }

    crabs() {
        return this.assets('crabs', 1);
    }

    createCrab() {
        const size = height * random(0.2, 0.35);
        this.draw(
            this.crabs().pop(),
            size, size,
            randomBlue(),
            random(0.8, 1),
            random(0, width - size),
            height - size
        );
    }

    chat() {
        return this.assets('chat', 1);
    }

    rings() {
        return this.assets('rings', 2);
    }

    createJunk(useWheels) {
        let items = [...this.chat(), ...this.rings()];
        if (useWheels) items.push(...this.wheels());
        items = shuffle(items);
        let size;

        // Left
        size = height * random(0.1, 0.3);
        this.draw(
            items.pop(),
            size, size,
            randomBlue(),
            random(0.1, 0.5),
            random(0, width / 2 - size),
            random(0, height - size)
        );

        // Middle
        size = height * random(0.1, 0.3);
        this.draw(
            items.pop(),
            size, size,
            randomBlue(),
            random(0.1, 0.5),
            random(width * (1 / 4), width * (3 / 4) - size),
            random(0, height - size)
        );

        // Right
        size = height * random(0.1, 0.3);
        this.draw(
            items.pop(),
            size, size,
            randomBlue(),
            random(0.1, 0.5),
            random(width / 2, width - size),
            random(0, height - size)
        );
    }

    fish() {
        return this.assets('fish', 3);
    }

    createFish() {
    }

    jellyfish() {
        return this.assets('jellyfish', 3);
    }

    createJellyfish() {
    }

    create(top) {
        const thisClass = this;
        let hasWheels, hasPlants;

        shuffle([
            function () {
                if (randomBool() && !hasWheels && !top) {
                    thisClass.createPlants();
                    hasPlants = true;
                }
            },
            function () {
                if (randomBool() && !hasPlants && !top) {
                    thisClass.createWheels();
                    hasWheels = true;
                }
            }
        ]).forEach(item => item());

        if (randomBool() && !top) thisClass.createCrab();

        shuffle([
            function () {
                if (randomBool()) thisClass.createJunk(!hasWheels);
            },
            function () {
                if (randomBool()) thisClass.createFish();
            },
            function () {
                if (randomBool()) thisClass.createJellyfish();
            }
        ]).slice(0, 2).forEach(item => item());
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

    create(columns, order) {
        const counts = [
            [1, 3],
            [1, 4],
            [2, 3],
            [3, 5]
        ];
        const sizes = [
            [
                [10, 15],
                [35, 40]
            ]
        ];

        const thisClass = this;
        randomColumns(columns, order, function (start, end) {
            const count = random(counts);
            const size = random(sizes);
            thisClass.draw(
                round(random(...count)),
                random(...size[0]),
                random(...size[1]),
                random(start, end)
            );
        });
    }

    draw(count, minSize, maxSize, xStart) {
        // Draw setup
        const color = randomBlue();
        const weight = randomWeight();
        smooth();
        noFill();
        stroke(...color, 1);
        strokeWeight(weight);

        // Make bubbles
        const spacing = max(2, random(-6, 12)); // Bias towards 2
        let lastSize = maxSize;
        let lastY = 0;
        for (let i = 0; i < count; i++) {
            noFill();

            const bubblesLeft = count - i;
            const allocatedDelta = (lastSize - minSize) / bubblesLeft;
            lastSize -= random(allocatedDelta * 0.75, allocatedDelta);

            const thisHeight = lastSize * random([1, 1, 1, 1.5, 1.75, 2]);
            lastY -= thisHeight + random(allocatedDelta * spacing * 0.75, allocatedDelta * spacing * 1.25);
            rect(xStart + random(-lastSize, lastSize) / 2, height + lastY, lastSize, thisHeight, lastSize / 2);
        }

        // TODO: some bubbles could have a cartoon shine line
    }
}

class Waves {

    horizontalY(topHalf, waveHeight, waves) {
        if (topHalf) return random(waveHeight * 2, height / 2 - 1.5 * waveHeight * waves);
        return random(height / 2, height - 1.5 * waveHeight * waves);
    }

    createSmallHorizontal(topHalf) {
        // Small waves
        const minWidth = width * 0.1;
        const maxWidth = width * 0.2;
        const waveHeight = random(height * 0.02, height * 0.03);
        const peaks = random(4, 6);
        const waves = round(random(2, 5));
        const xRandom = () => random(width * -0.05, width * 0.05);
        const x = random(0, width - maxWidth);
        const y = this.horizontalY(topHalf, waveHeight, waves);

        // Render
        const group = this.group(
            minWidth,
            maxWidth,
            waveHeight,
            peaks,
            waves,
            xRandom
        );
        image(group, x, y, group.width, group.height, x, y, group.width, group.height);
    }

    createBigHorizontal(topHalf) {
        // Big waves
        const minWidth = width * 0.4;
        const maxWidth = width * 0.6;
        const waveHeight = random(height * 0.04, height * 0.08);
        const peaks = random(2, 4);
        const waves = round(random(2, 3));
        const xRandom = () => random(width * -0.1, width * 0.1);
        const x = random(0, width - maxWidth);
        const y = this.horizontalY(topHalf, waveHeight, waves);

        // Render
        const group = this.group(
            minWidth,
            maxWidth,
            waveHeight,
            peaks,
            waves,
            xRandom
        );
        image(group, x, y, group.width, group.height, x, y, group.width, group.height);
    }

    createAllHorizontal(top) {
        // Show a top wave
        if (randomBool()) {
            let wave = this.createSmallHorizontal;
            if (top) wave = random([this.createBigHorizontal, this.createSmallHorizontal]);
            wave.bind(this, true)();
        }

        // Show a bottom wave
        if (top && randomBool()) {
            const wave = random([this.createBigHorizontal, this.createSmallHorizontal]);
            wave.bind(this, false)();
        }
    }

    createVertical(x) {
        const minHeight = height * 0.2;
        const maxHeight = height * 0.5;
        const waveWidth = random(width * 0.005, width * 0.015);
        const peaks = random(2, 4);
        const waves = round(random(2, 3));
        const yRandom = () => 0;
        const y = height - maxHeight;

        // Render
        const group = this.group(
            minHeight,
            maxHeight,
            waveWidth,
            peaks,
            waves,
            yRandom
        );
        const base = createGraphics(group.height, group.width, SVG);
        base.rotate(-PI / 2);
        base.image(group, 0, 0, group.width, group.height, -base.height, 0, group.width, group.height);
        image(base, x, y, base.width, base.height, x, y, base.width, base.height);
    }

    createAllVertical(columns, order) {
        const thisClass = this;
        randomColumns(columns, order, function (start, end) {
            thisClass.createVertical(random(start, end));
        });
    }

    group(minWidth, maxWidth, waveHeight, peaks, waves, xRandom) {
        const base = createGraphics(maxWidth, waveHeight * waves * 1.5, SVG);
        const period = ((minWidth + maxWidth) / 2) / peaks;
        const color = randomBlue();
        const weight = randomWeight();
        for (let i = 0; i < waves; i++) {
            this.draw(
                base,
                period,
                waveHeight / 2,
                random(minWidth, maxWidth),
                xRandom(),
                (waveHeight / 2 + i * waveHeight) * 1.5,
                color,
                weight
            );
        }
        return base;
        // TODO: A group of waves might have glow-y shadow
        // TODO: A group of waves might have drop shadow
    }

    draw(base, period, amplitude, width, xStart, yStart, color, weight) {
        // Generate
        const yvalues = [];
        let x = TWO_PI * (xStart / period);
        for (let i = 0; i < width; i++) {
            yvalues.push(sin(x) * amplitude);
            x += TWO_PI / period;
        }

        // Draw
        base.smooth();
        base.noFill();
        base.stroke(color);
        base.strokeWeight(weight);
        base.beginShape();
        for (let x = 0; x < yvalues.length; x++) {
            base.curveVertex(x + xStart, yvalues[x] + yStart);
        }
        base.endShape();
    }
}
