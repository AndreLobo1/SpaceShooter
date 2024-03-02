// Definição da cena de instruções/menu
var Instructions = new Phaser.Class({
    Extends: Phaser.Scene,

    // Configura a cena de instruções/menu
    create: function () {
        // Estilo do texto
        var style = {
            fontFamily: 'Arial',
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center',
            wordWrap: { width: 600, useAdvancedWrap: true }
        };

        // Adiciona as instruções na tela
        var text = "Bem-vindo ao SpaceShooter!\n\nUse as setas para cima, para baixo, para a esquerda e para a direita para controlar a nave.\nSeu objetivo é destruir os asteroides para ganhar pontos e sobreviver o máximo que puder!\n\nColete o power-up de vida para ganhar uma vida extra!";
        this.add.text(400, 300, text, style).setOrigin(0.5);

        // Adiciona o botão "Jogar"
        var playButton = this.add.text(400, 450, 'Jogar', { fontFamily: 'Arial', fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
        playButton.setInteractive();

        // Configura a ação de clicar no botão "Jogar"
        playButton.on('pointerdown', function () {
            this.scene.start('game'); // Inicia a cena do jogo principal
        }, this);
    }
});

// Definição da cena de Game Over
var GameOver = new Phaser.Class({
    Extends: Phaser.Scene,

    // Construtor da cena de Game Over
    initialize: function GameOver() {
        Phaser.Scene.call(this, { key: 'gameOver' });
    },

    // Carrega recursos específicos para a cena de Game Over
    preload: function () {
        // Se houver algum preload específico para a cena de Game Over, coloque aqui
    },

    // Configura a cena de Game Over
    create: function () {
        // Exibe texto de "Fim de Jogo" no centro da tela
        var gameOverText = this.add.text(config.width / 2, config.height / 2, 'Fim de Jogo', { fontSize: '64px', fill: '#fff' });
        gameOverText.setOrigin(0.5);

        // Exibe a pontuação alcançada
        var scoreText = this.add.text(config.width / 2, config.height / 2 + 100, 'Pontuação: ' + pontos, { fontSize: '32px', fill: '#fff' });
        scoreText.setOrigin(0.5);

        // Adiciona o botão "Reiniciar"
        var restartButton = this.add.text(config.width / 2, config.height / 2 + 200, 'Reiniciar', { fontSize: '32px', fill: '#fff' });
        restartButton.setOrigin(0.5);
        restartButton.setInteractive();

        // Configura a ação de clicar no botão "Reiniciar"
        restartButton.on('pointerdown', function () {
            // Reinicia o jogo
            pontos = 0;
            vidas = 3;
            this.scene.start('game');
        }, this);
    }
});

// Definição da cena do jogo
var Game = new Phaser.Class({
    Extends: Phaser.Scene,

    // Construtor da cena do jogo
    initialize: function Game() {
        Phaser.Scene.call(this, { key: 'game' });
    },

    // Carrega os recursos necessários para o jogo
    preload: function () {
        // Carrega imagens dos elementos do jogo
        this.load.image('Nave', 'assets/Nave.png'); // Imagem da nave do jogador
        this.load.image('Tiro', 'assets/Tiro.png'); // Imagem do projétil
        this.load.image('Meteoro1', 'assets/Meteoro1.png'); // Imagem do meteoro tipo 1
        this.load.image('Meteoro2', 'assets/Meteoro2.png'); // Imagem do meteoro tipo 2
        this.load.image('Meteoro3', 'assets/Meteoro3.png'); // Imagem do meteoro tipo 3
        this.load.image('Meteoro4', 'assets/Meteoro4.png'); // Imagem do meteoro tipo 4
        this.load.image('PowerUp', 'assets/ufoBlue.png'); // Imagem do power-up padrão

        // Pré-carrega as imagens de explosão
        for (var i = 0; i <= 8; i++) {
            this.load.image('Explosao' + i, 'assets/Explosion/explosion0' + i + '.png');
        }
    },

    // Configura a cena do jogo
    create: function () {
        // Inicializa o temporizador para controlar a cadência de tiro do jogador
        tirosTimer = this.time.addEvent({
            delay: delayPadraoTiro, // Intervalo entre os disparos em milissegundos
            callback: dispararTiro, // Função de callback para disparar um tiro
            callbackScope: this, // Escopo da chamada de retorno
            loop: true // Indica que o evento se repete periodicamente
        });

        // Configuração inicial da nave do jogador
        nave = this.physics.add.sprite(50, config.height / 2, 'Nave').setOrigin(0.5);
        nave.setCollideWorldBounds(true); // Garante que a nave não saia dos limites do mundo
        nave.setScale(1); // Define a escala da nave

        // Grupos para armazenar tiros, meteoros e power-ups
        tiros = this.physics.add.group();
        meteoros = this.physics.add.group();
        powerUps = this.physics.add.group();

        // Cria um temporizador para gerar meteoros periodicamente
        criarMeteoroTimer = this.time.addEvent({
            delay: delayInicial, // Define o intervalo inicial entre a criação de meteoros em milissegundos
            callback: criarMeteoro, // Função de callback para criar um meteoro
            callbackScope: this, // Escopo da chamada de retorno
            loop: true // Indica que o evento se repete periodicamente
        });

        cursors = this.input.keyboard.createCursorKeys(); // Captura as teclas de seta

        // Configura colisões entre tiros, meteoros, e power-ups, e entre nave e meteoros
        this.physics.add.collider(tiros, meteoros, colisaoTiroMeteoro, null, this);
        this.physics.add.collider(nave, meteoros, colisaoNaveMeteoro, null, this);
        this.physics.add.collider(tiros, powerUps, colisaoTiroPowerUp, null, this);
        this.physics.add.collider(nave, powerUps, colisaoNavePowerUp, null, this);

        // Texto para exibir vidas e pontos
        textoVidas = this.add.text(16, 16, 'Vidas: ' + vidas, { fontSize: '32px', fill: '#fff' }).setDepth(1); // Define a profundidade do texto
        textoPontos = this.add.text(16, 64, 'Pontos: ' + pontos, { fontSize: '32px', fill: '#fff' }).setDepth(1); // Define a profundidade do texto
    },

    // Atualiza a cena do jogo
    update: function () {
        // Move a nave do jogador com base nas teclas pressionadas
        if (cursors.up.isDown) {
            nave.setVelocityY(-200);
        } else if (cursors.down.isDown) {
            nave.setVelocityY(200);
        } else {
            nave.setVelocityY(0);
        }

        // Move a nave do jogador para a esquerda ou direita com base nas teclas pressionadas
        if (cursors.left.isDown) {
            nave.setVelocityX(-200);
        } else if (cursors.right.isDown) {
            nave.setVelocityX(200);
        } else {
            nave.setVelocityX(0);
        }
    }
});

// Configuração do jogo
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false // Desabilita o modo de debug do Arcade Physics
        }
    },
    scene: [Instructions, Game, GameOver] // Define as cenas do jogo
};

// Variáveis globais
var nave; // Referência para a nave do jogador
var tiros; // Grupo para armazenar os tiros
var meteoros; // Grupo para armazenar os meteoros
var powerUps; // Grupo para armazenar os power-ups
var vidas = 3; // Quantidade de vidas inicial do jogador
var pontos = 0; // Pontuação inicial do jogador
var textoVidas; // Texto para exibir a quantidade de vidas
var textoPontos; // Texto para exibir a pontuação
var cursors; // Referência para as teclas de seta
var delayInicial = 3000; // Intervalo inicial entre a criação de meteoros em milissegundos
var delayMinimo = 500; // Intervalo mínimo entre a criação de meteoros em milissegundos
var reducaoDelay = 50; // Valor de redução do intervalo de criação de meteoros em milissegundos
var criarMeteoroTimer; // Temporizador para criar meteoros periodicamente
var delayPadraoTiro = 1000; // Valor padrão de 1000 milissegundos
var tirosTimer; // Temporizador para controlar a cadência de tiro do jogador

// Funções globais para as interações do jogo

// Função para disparar tiros
function dispararTiro() {
    var tiro = tiros.create(nave.x + 50, nave.y, 'Tiro');
    tiro.setVelocityX(250);
}

// Função para criar um meteoro
function criarMeteoro() {
    var resistencia = Phaser.Math.Between(1, 3);

    var meteoro = meteoros.create(config.width, Phaser.Math.Between(0, config.height), 'Meteoro' + Phaser.Math.Between(1, 4));
    meteoro.setVelocityX(-Phaser.Math.Between(50, 200));
    meteoro.setScale(0.3);
    meteoro.resistencia = resistencia;

    criarMeteoroTimer.delay = Math.max(criarMeteoroTimer.delay - reducaoDelay, delayMinimo);

    // Adiciona o power-up padrão com uma chance aleatória
    if (Phaser.Math.Between(1, 10) === 1) {
        var powerUp = powerUps.create(meteoro.x, meteoro.y, 'PowerUp');
        powerUp.setVelocityX(-100);
    }
}

// Função para tratar colisões entre tiros e meteoros
function colisaoTiroMeteoro(tiro, meteoro) {
    if (tiro.texture.key === 'Tiro') {
        tiro.destroy();
        meteoro.resistencia--;

        // Verifica se o meteoro foi destruído
        if (meteoro.resistencia <= 0) {
            meteoro.destroy(); // Remove o meteoro do jogo
            pontos++; // Incrementa a pontuação do jogador
            textoPontos.setText('Pontos: ' + pontos); // Atualiza o texto de pontos

            // Escolhe um número aleatório entre 0 e 8 para determinar o arquivo de explosão
            var numExplosao = Phaser.Math.Between(0, 8);
            var nomeExplosao = 'Explosao' + numExplosao;

            // Cria uma explosão onde o meteoro foi destruído
            var explosao = this.add.image(meteoro.x, meteoro.y, nomeExplosao);
            explosao.setScale(0.5);

            // Programa a remoção da explosão após um intervalo de tempo
            this.time.delayedCall(500, function() {
                explosao.destroy();
            }, [], this);
        }
    }
}

// Função para tratar colisões entre a nave e os meteoros
function colisaoNaveMeteoro(nave, meteoro) {
    vidas--; // Decrementa a quantidade de vidas
    textoVidas.setText('Vidas: ' + vidas); // Atualiza o texto de vidas

    // Verifica se o jogador ficou sem vidas
    if (vidas === 0) {
        this.scene.start('gameOver'); // Transita para a cena de Game Over
    }

    meteoro.destroy(); // Remove o meteoro do jogo
}

// Função para tratar colisões entre tiros e power-ups
function colisaoTiroPowerUp(tiro, powerUp) {
    tiro.destroy(); // Remove o tiro do jogo
    powerUp.destroy(); // Remove o power-up do jogo

    // Adiciona uma vida extra ao jogador
    vidas++;
    textoVidas.setText('Vidas: ' + vidas); // Atualiza o texto de vidas

    // Escolhe um número aleatório entre 0 e 8 para determinar o arquivo de explosão
    var numExplosao = Phaser.Math.Between(0, 8);
    var nomeExplosao = 'Explosao' + numExplosao;

    // Cria uma explosão onde o power-up foi destruído
    var explosao = this.add.image(powerUp.x, powerUp.y, nomeExplosao);
    explosao.setScale(0.5);

    // Programa a remoção da explosão após um intervalo de tempo
    this.time.delayedCall(500, function() {
        explosao.destroy();
    }, [], this);
}

// Função para tratar colisões entre a nave e os power-ups
function colisaoNavePowerUp(nave, powerUp) {
    vidas--; // Decrementa a quantidade de vidas
    textoVidas.setText('Vidas: ' + vidas); // Atualiza o texto de vidas

    // Verifica se o jogador ficou sem vidas
    if (vidas === 0) {
        this.scene.start('gameOver'); // Transita para a cena de Game Over
    }

    powerUp.destroy(); // Remove o power-up do jogo
}

// Inicializa o jogo com a configuração definida
var game = new Phaser.Game(config);
