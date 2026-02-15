import Phaser from 'phaser';

export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    preload() {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        
        // --- Small Plane Graphic ---
        graphics.fillStyle(0xffffff);
        graphics.fillRoundedRect(0, 20, 100, 40, 10); // Body
        graphics.fillStyle(0xff0000);
        graphics.fillRect(40, 0, 20, 80); // Wings
        graphics.fillRect(0, 10, 10, 30); // Tail
        graphics.fillStyle(0x333333);
        graphics.fillRect(95, 25, 5, 30); // Propeller
        graphics.generateTexture('plane', 100, 80);

        // --- Airport Gate ---
        graphics.clear().fillStyle(0xaaaaaa).fillRect(0, 0, 200, 300); // Building
        graphics.fillStyle(0x333333).fillRect(140, 200, 60, 100); // Door
        graphics.generateTexture('airport_gate', 200, 300);
    }

    create() {
        const sky = this.add.tileSprite(0, 0, 1280, 720, 'bg_sky').setOrigin(0);
        const mountains = this.add.tileSprite(0, 720, 1280, 400, 'bg_mountains').setOrigin(0, 1);
        const gate = this.add.image(1400, 550, 'airport_gate').setOrigin(0.5, 1);
        
        this.add.text(640, 100, 'OFF TO CANADA!', {
            fontSize: '64px',
            color: '#ffffff',
            stroke: '#ff0000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Plane with dogs visible in "windows"
        const planeContainer = this.add.container(-200, 400);
        const plane = this.add.image(0, 0, 'plane');
        const nellieHead = this.add.image(-20, -5, 'nellie').setScale(0.3);
        const leoHead = this.add.image(10, -5, 'leo').setScale(0.3);
        planeContainer.add([plane, nellieHead, leoHead]);

        // Fly and Land Animation
        this.tweens.add({
            targets: planeContainer,
            x: 1200,
            y: 600,
            duration: 4000,
            ease: 'Power2',
            onUpdate: () => {
                sky.tilePositionX += 5;
                mountains.tilePositionX += 1;
                if (gate.x > 1100) gate.x -= 2;
            },
            onComplete: () => {
                this.deboardDogs(planeContainer, gate);
            }
        });
    }

    private deboardDogs(plane: Phaser.GameObjects.Container, gate: Phaser.GameObjects.Image) {
        this.add.text(640, 200, 'LANDED IN CANADA!', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);
        
        // Nellie and Leo walk out of the plane towards the gate
        const nellie = this.add.image(plane.x - 20, plane.y, 'nellie').setScale(0.5);
        const leo = this.add.image(plane.x + 10, plane.y, 'leo').setScale(0.5);
        
        this.tweens.add({
            targets: [nellie, leo],
            x: gate.x,
            alpha: 0,
            duration: 2000,
            delay: 1000,
            onComplete: () => {
                this.scene.start('BossScene');
            }
        });
    }
}
