const alert = document.getElementById("alert");
alert.addEventListener("click", () => {
    alert.className = "";
    newGame();
});

function newGame() {
    const parentElement = document.getElementById("board");
    parentElement.innerHTML = '';
    const game = new Game();
}

class Piece {
    constructor(color, density, height, shape) {
        this.id = [color, density, height, shape].join("");

        this.color = Piece.valueFromTraitAndNumber("color", color);
        this.density = Piece.valueFromTraitAndNumber("density", density);
        this.height = Piece.valueFromTraitAndNumber("height", height);
        this.shape = Piece.valueFromTraitAndNumber("shape", shape);

        this.x = undefined;
        this.y = undefined;

        this.element = document.createElement("span");

        this.element.className = ["piece", this.color, this.density, this.height, this.shape].join(" ");
    }

    place(x, y) {
        this.x = x;
        this.y = y;

        this.element.style.setProperty("--x", x);
        this.element.style.setProperty("--y", y);

        this.deactivate();
    }

    placeInitial(x, y) {
        this.place(x, y);

        this.element.style.setProperty("--initial-x", x);
        this.element.style.setProperty("--initial-y", y);
    }

    reset() {
        this.element.style.removeProperty("--x", x);
        this.element.style.removeProperty("--y", y);

        this.x = undefined;
        this.y = undefined;

        this.deactivate();
    }

    activate() {
        this.element.classList.add("active");
    }

    deactivate() {
        this.element.classList.remove("active");
    }

    static valueFromTraitAndNumber(trait, number) {
        if (trait === "color") return number ? "dark" : "light";
        if (trait === "density") return number ? "hollow" : "solid";
        if (trait === "height") return number ? "tall" : "short";
        if (trait === "shape") return number ? "square" : "round";
    }
}

class Game {
    constructor() {
        this.board = document.getElementById("board");
        this.generateMatrix();
        this.generatePieces();
    }

    generateMatrix() {
        this.matrix = [
            undefined, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined,
        ];

        this.matrix.forEach((_, i) => {
            const y = Math.floor(i / 4);
            const x = i % 4;

            const tile = document.createElement("span");

            tile.className = "tile";

            const xLabel = ["A", "B", "C", "D"][x];
            tile.setAttribute("label", `${xLabel}${y + 1}`);

            tile.addEventListener("click", () => {
                this.onTileClick(x, y);
            });

            this.board.appendChild(tile);
        });
    }

    generatePieces() {
        this.pieces = {};

        const pieces = [
            new Piece(0, 0, 0, 0), new Piece(0, 0, 0, 1), new Piece(0, 0, 1, 0), new Piece(0, 0, 1, 1),
            new Piece(0, 1, 0, 0), new Piece(0, 1, 0, 1), new Piece(0, 1, 1, 0), new Piece(0, 1, 1, 1),
            new Piece(1, 0, 0, 0), new Piece(1, 0, 0, 1), new Piece(1, 0, 1, 0), new Piece(1, 0, 1, 1),
            new Piece(1, 1, 0, 0), new Piece(1, 1, 0, 1), new Piece(1, 1, 1, 0), new Piece(1, 1, 1, 1),
        ];

        pieces.forEach((piece, i) => {
            this.pieces[piece.id] = piece;

            let x, y;

            if (i < 4) {
                x = i;
                y = -1;
            } else if (i < 8) {
                x = 4;
                y = i % 4;
            } else if (i < 12) {
                x = 3 - (i % 4);
                y = 4;
            } else {
                x = -1;
                y = 3 - (i % 4);
            }

            piece.placeInitial(x, y);

            piece.element.addEventListener("click", () => this.onPieceClick(piece));
            piece.element.addEventListener("dblclick", () => this.onPieceDblClick(piece));

            this.board.appendChild(piece.element);
        });
    }

    onPieceClick(piece) {
        if (this.selectedPieceId === piece.id) {
            piece.deactivate();
            this.selectedPieceId = undefined;
        }
        else {
            if (this.selectedPieceId) {
                this.pieces[this.selectedPieceId].deactivate();
            }
            piece.activate();
            this.selectedPieceId = piece.id;
        }
    }

    onPieceDblClick(piece) {
        const idx = piece.y * 4 + piece.x;

        if (this.matrix[idx] === piece.id) {
            this.matrix[idx] = undefined;
        }

        piece.reset();
        this.selectedPieceId = undefined;
    }

    onTileClick(x, y) {
        if (this.selectedPieceId) {
            this.placeSelectedPiece(x, y);
        }
    }

    placeSelectedPiece(x, y) {
        const piece = this.pieces[this.selectedPieceId];
        const idx = piece.y * 4 + piece.x;
        if (this.matrix[idx] === piece.id) {
            this.matrix[idx] = undefined;
        }

        piece.place(x, y);

        this.matrix[y * 4 + x] = this.selectedPieceId;
        this.selectedPieceId = undefined;
        this.detectGameOver(piece.color);
    }

    detectGameOver(color) {
        const checks = [
            [0, 1, 2, 3], [4, 5, 6, 7],
            [8, 9, 10, 11], [12, 13, 14, 15],
            [0, 4, 8, 12], [1, 5, 9, 13],
            [2, 6, 10, 14], [3, 7, 11, 15],
            [0, 5, 10, 15], [12, 9, 6, 3]
        ];

        const traits = ["color", "density", "height", "shape"];
        const matches = [];

        checks.forEach((indexes) => {
            const matrixValues = indexes.map((idx) => this.matrix[idx]).filter((v) => v !== undefined);

            if (matrixValues.length === 4) {
                traits.forEach((trait, i) => {
                    const distinct = [...new Set(matrixValues.map((str) => str.charAt(i)))];
                    if (distinct.length === 1) {
                        const value = Piece.valueFromTraitAndNumber(trait, parseInt(distinct[0]));
                        matches.push({ trait, indexes, value });
                    }
                });
            }
        });

        if (matches.length) {
            this.onGameOver(matches, color);
        }
    }

    onGameOver(data, color) {
        const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
        const rus = (s) => {
            const dictionary = {
                light: 'светлые',
                dark: 'темные',
                round: 'круглые',
                square: 'квадратные',
                tall: 'большие',
                short: 'маленькие',
                hollow: 'полосатые',
                solid: 'закрашенные',
            };

            return dictionary[s] || s;
        };

        setTimeout(() => {
            const text = data.map(
                ({ value }) => cap(rus(value))
            ).join(" / ");
            console.log(text);
            alert.style.setProperty("--color", `var(--color-${color})`);
            alert.innerHTML = `<div> Игра окончена!<br>${text}</div>`;
            alert.className = "active";
        }, 100);
    }
}

newGame();