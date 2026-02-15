import Phaser from 'phaser';
import { Nellie, Leo } from '../objects/Dog';

export default class GameScene extends Phaser.Scene {
    private nellie!: Nellie;
    private leo!: Leo;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private boulders!: Phaser.Physics.Arcade.Group;
    private activeDog!: Nellie | Leo;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private goal!: Phaser.Physics.Arcade.Sprite;
    private isGameOver: boolean = false;
    private followMode: boolean = true;

    private bgMountains!: Phaser.GameObjects.TileSprite;
    private bgPines!: Phaser.GameObjects.TileSprite;

    constructor() {
        super('GameScene');
    }

    init(data: { followMode: boolean }) {
        this.followMode = data.followMode ?? true;
        this.isGameOver = false;
    }

    preload() {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.clear().fillStyle(0x5d4037).fillRect(0, 0, 32, 32);
        graphics.fillStyle(0x2e7d32).fillRect(0, 0, 32, 8);
        graphics.lineStyle(2, 0x1b5e20).strokeRect(0, 0, 32, 32);
        graphics.generateTexture('ground', 32, 32);

        graphics.clear().fillStyle(0x4a3728); 
        graphics.fillRoundedRect(0, 20, 64, 44, 10).fillCircle(45, 25, 20);
        graphics.fillRoundedRect(35, 20, 10, 25, 5).fillRoundedRect(55, 20, 10, 25, 5).fillRoundedRect(-5, 25, 20, 10, 5);
        graphics.generateTexture('nellie', 70, 70);

        graphics.clear().fillStyle(0xd2b48c);
        graphics.fillRoundedRect(0, 10, 32, 22, 5).fillCircle(25, 12, 12);
        graphics.fillTriangle(18, 5, 23, -5, 28, 5).fillTriangle(25, 5, 30, -5, 35, 5).fillRoundedRect(-2, 15, 8, 5, 2);
        graphics.generateTexture('leo', 40, 40);

        graphics.clear().fillStyle(0x757575).fillCircle(32, 32, 32).lineStyle(3, 0x424242).strokeCircle(32, 32, 32);
        graphics.generateTexture('boulder', 64, 64);

        graphics.clear().fillGradientStyle(0x87ceeb, 0x87ceeb, 0x4682b4, 0x4682b4, 1).fillRect(0, 0, 1280, 720).generateTexture('bg_sky', 1280, 720);
        graphics.clear().fillStyle(0x4b5d67).fillTriangle(200, 400, 600, 100, 1000, 400).generateTexture('bg_mountains', 1280, 400);
        graphics.clear().fillStyle(0x1a3c34).beginPath().moveTo(25, 0).lineTo(50, 60).lineTo(0, 60).closePath().fillPath().generateTexture('bg_pines', 50, 60);

        graphics.clear().fillStyle(0xff0000).fillRect(0, 0, 60, 40).fillStyle(0xffffff).fillRect(20, 0, 20, 40);
        graphics.fillStyle(0xff0000).fillRect(27, 15, 6, 10).fillTriangle(30, 10, 22, 25, 38, 25).generateTexture('flag', 60, 40);
    }

    create() {
        const worldWidth = 10000; 
        const worldHeight = 1200; 

        this.add.tileSprite(0, 0, 1280, 720, 'bg_sky').setOrigin(0).setScrollFactor(0);
        this.bgMountains = this.add.tileSprite(0, 720, 1280, 400, 'bg_mountains').setOrigin(0, 1).setScrollFactor(0);
        this.bgPines = this.add.tileSprite(0, 720, 1280, 120, 'bg_pines').setOrigin(0, 1).setScrollFactor(0).setTileScale(2);

        this.platforms = this.physics.add.staticGroup();
        this.boulders = this.physics.add.group({ dragX: 1000, bounceX: 0.1, bounceY: 0.1 });

        let lastRightEdge = 0;
        let currentY = 1000;

        // Start
        this.createPlatform(0, 1000, currentY);
        lastRightEdge = 1000;

        // Middle Procedural
        while (lastRightEdge < worldWidth - 1200) {
            const gap = Phaser.Math.Between(120, 180); 
            const verticalDiff = Phaser.Math.Between(-80, 80);
            const nextWidth = Phaser.Math.Between(300, 600);
            
            currentY = Phaser.Math.Clamp(currentY + verticalDiff, 500, 1050);
            const nextX = lastRightEdge + gap + (nextWidth / 2);
            
            const segmentType = Phaser.Math.Between(0, 4);
            switch (segmentType) {
                case 0: // Normal
                    this.createPlatform(nextX - (nextWidth/2), nextWidth, currentY);
                    lastRightEdge = nextX + (nextWidth / 2);
                    break;
                case 1: // Steps
                    let stepX = lastRightEdge + gap;
                    for (let i = 0; i < 3; i++) {
                        this.createPlatform(stepX, 150, currentY - (i * 80));
                        stepX += 200;
                    }
                    currentY -= 160;
                    lastRightEdge = stepX - 50;
                    break;
                case 2: // Ramp
                    this.createRamp(lastRightEdge + gap, 600, currentY, Phaser.Math.Between(-100, 100));
                    lastRightEdge += gap + 600;
                    break;
                case 3: // Boulder
                    this.createPlatform(nextX - (nextWidth/2), nextWidth, currentY);
                    const b = this.boulders.create(nextX, currentY - 100, 'boulder');
                    b.setCollideWorldBounds(true).setMass(20).setCircle(32);
                    lastRightEdge = nextX + (nextWidth / 2);
                    break;
                case 4: // Squeeze
                    this.createPlatform(nextX - (nextWidth/2), nextWidth, currentY);
                    this.platforms.create(nextX, currentY - 60, 'ground').setScale(nextWidth/32, 1).refreshBody();
                    lastRightEdge = nextX + (nextWidth / 2);
                    break;
            }
        }

        // Final Bridge to Goal
        const finalBridgeWidth = worldWidth - lastRightEdge;
        this.createPlatform(lastRightEdge + 50, finalBridgeWidth, currentY);
        
        // Goal
        this.goal = this.physics.add.staticSprite(worldWidth - 300, currentY - 60, 'flag').setScale(2);

        this.nellie = new Nellie(this, 300, 800);
        this.leo = new Leo(this, 450, 800);

        this.physics.add.collider([this.nellie, this.leo], this.platforms);
        this.physics.add.collider(this.boulders, this.platforms);
        this.physics.add.collider([this.nellie, this.leo], this.boulders);
        this.physics.add.collider(this.nellie, this.leo);

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.input.keyboard!.on('keydown-SPACE', () => this.swapDogs());

        this.activeDog = this.nellie;
        this.nellie.setActiveDog(true);
        this.leo.setActiveDog(false);

        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight + 400);
    }

    private createPlatform(x: number, width: number, y: number) {
        this.platforms.create(x + width/2, y + 16, 'ground').setScale(width/32, 2).refreshBody();
    }

    private createRamp(x: number, width: number, startY: number, heightDiff: number) {
        const steps = 20;
        const stepWidth = width / steps;
        const stepHeight = heightDiff / steps;
        for (let i = 0; i < steps; i++) {
            this.platforms.create(x + (i * stepWidth) + stepWidth/2, startY + (i * stepHeight), 'ground')
                .setScale(stepWidth/32, 2).refreshBody();
        }
    }

    update() {
        if (this.isGameOver) return;
        if (this.activeDog.y > 1200) { this.triggerGameOver('YOU HAVE FALLEN!'); return; }

        const inactiveDog = (this.activeDog === this.nellie) ? this.leo : this.nellie;
        if (inactiveDog.y > 1200) {
            inactiveDog.x = this.activeDog.x;
            inactiveDog.y = this.activeDog.y - 50;
            inactiveDog.setVelocity(0, 0);
        }

        if (this.activeDog) this.activeDog.update(this.cursors);

        if (this.followMode) {
            const distX = Math.abs(this.activeDog.x - inactiveDog.x);
            const direction = this.activeDog.x > inactiveDog.x ? 1 : -1;
            if (distX > 100) {
                inactiveDog.setVelocityX(direction * (distX > 400 ? 250 : 120));
                inactiveDog.setFlipX(direction < 0);
                if (inactiveDog.body?.touching.down && (inactiveDog.body.blocked.left || inactiveDog.body.blocked.right || this.activeDog.y < inactiveDog.y - 60)) {
                    inactiveDog.setVelocityY(-850);
                }
            } else {
                inactiveDog.setVelocityX(0);
            }
        } else {
            inactiveDog.setVelocityX(0);
        }

        const minX = Math.min(this.nellie.x, this.leo.x);
        const maxX = Math.max(this.nellie.x, this.leo.x);
        const midX = (minX + maxX) / 2;
        const maxDist = 1100;
        
        if (maxX - minX > maxDist) {
            if (this.activeDog.x === maxX) this.activeDog.x = minX + maxDist;
            else this.activeDog.x = maxX - maxDist;
            this.activeDog.setVelocityX(0);
        }

        this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, midX - 640, 0.1);
        const midY = (this.nellie.y + this.leo.y) / 2;
        this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, midY - 360, 0.1);

        this.bgMountains.tilePositionX = this.cameras.main.scrollX * 0.2;
        this.bgPines.tilePositionX = this.cameras.main.scrollX * 0.5;

        if (this.physics.overlap(this.nellie, this.goal) && this.physics.overlap(this.leo, this.goal)) {
            this.isGameOver = true;
            this.time.delayedCall(1500, () => this.scene.start('VictoryScene'));
        }
    }

    private triggerGameOver(message: string) {
        this.isGameOver = true;
        this.physics.pause();
        this.cameras.main.shake(250, 0.01);
        this.add.text(640, 360, message + '\n\nCLICK TO RETRY', {
            fontSize: '48px', color: '#ff0000', stroke: '#ffffff', strokeThickness: 6, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0);
        this.input.once('pointerdown', () => this.scene.restart({ followMode: this.followMode }));
    }

    private swapDogs() {
        if (this.isGameOver) return;
        this.activeDog.setActiveDog(false);
        this.activeDog = (this.activeDog === this.nellie) ? this.leo : this.nellie;
        this.activeDog.setActiveDog(true);
    }
}
