import Phaser from 'phaser';

export default class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    preload() {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        
        // --- Canadian Mountain Graphic ---
        graphics.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x4682b4, 0x4682b4, 1);
        graphics.fillRect(0, 0, 800, 400);
        
        // Mountains
        graphics.fillStyle(0x4b5d67);
        graphics.fillTriangle(100, 400, 300, 100, 500, 400);
        graphics.fillTriangle(300, 400, 500, 150, 700, 400);
        
        // Snow caps
        graphics.fillStyle(0xffffff);
        graphics.fillTriangle(266, 150, 300, 100, 333, 150);
        graphics.fillTriangle(460, 200, 500, 150, 540, 200);
        
        graphics.generateTexture('game_graphic', 800, 400);
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x242424);
        this.add.image(640, 220, 'game_graphic').setScale(0.8);
        
        this.add.text(640, 120, 'SLOPE SCRAMBLE', {
            fontSize: '72px', color: '#ffffff', stroke: '#ff0000', strokeThickness: 8, fontStyle: 'bold'
        }).setOrigin(0.5);

        // --- Left Column: Full Journey ---
        this.add.text(320, 380, 'THE FULL JOURNEY', { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        
        this.createButton(320, 460, 'CO-OP MODE', 'Level 1 (Follow)', () => {
            this.scene.start('GameScene', { followMode: true });
        });

        this.createButton(320, 560, 'DUO MODE', 'Level 1 (Manual)', () => {
            this.scene.start('GameScene', { followMode: false });
        });

        // --- Right Column: Boss Challenge ---
        this.add.text(960, 380, 'BOSS CHALLENGE', { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

        this.createButton(960, 460, 'BOSS RUSH (CO-OP)', 'Jump to Hangar', () => {
            this.scene.start('BossScene', { followMode: true });
        });

        this.createButton(960, 560, 'BOSS RUSH (DUO)', 'Jump to Hangar', () => {
            this.scene.start('BossScene', { followMode: false });
        });

        // Continue Button (If checkpoint exists)
        const hasCheckpoint = localStorage.getItem('slopeScramble_checkpoint');
        if (hasCheckpoint) {
            const contBtn = this.createButton(640, 680, 'RESUME CHECKPOINT', 'Back to the fight', () => {
                this.scene.start('BossScene');
            });
            contBtn.setScale(0.8);
        }
    }

    private createButton(x: number, y: number, label: string, subtext: string, callback: () => void) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 400, 80, 0x333333).setInteractive({ useHandCursor: true });
        const text = this.add.text(0, -10, label, { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        const sub = this.add.text(0, 25, subtext, { fontSize: '14px', color: '#aaaaaa' }).setOrigin(0.5);
        
        container.add([bg, text, sub]);

        bg.on('pointerover', () => bg.setFillStyle(0x555555));
        bg.on('pointerout', () => bg.setFillStyle(0x333333));
        bg.on('pointerdown', callback);

        return container;
    }
}
