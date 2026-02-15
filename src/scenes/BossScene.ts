import Phaser from 'phaser';
import { Nellie, Leo } from '../objects/Dog';

export default class BossScene extends Phaser.Scene {
    private nellie!: Nellie;
    private leo!: Leo;
    private boss!: Phaser.Physics.Arcade.Sprite;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private activeDog!: Nellie | Leo;
    
    private bossHealth: number = 100;
    private nellieHealth: number = 100;
    private leoHealth: number = 100;
    
    private bossHealthBar!: Phaser.GameObjects.Graphics;
    private nellieHealthBar!: Phaser.GameObjects.Graphics;
    private leoHealthBar!: Phaser.GameObjects.Graphics;
    
    private lasers!: Phaser.Physics.Arcade.Group;
    private isBattleActive: boolean = false;
    private lastLaserTime: number = 0;
    private lastLeapTime: number = 0;
    private bossInvincible: boolean = false;
    private followMode: boolean = true;

    constructor() {
        super('BossScene');
    }

    init(data: { followMode: boolean }) {
        this.followMode = data.followMode ?? true;
        this.bossHealth = 100;
        this.nellieHealth = 100;
        this.leoHealth = 100;
        this.isBattleActive = false;
        this.lastLaserTime = 0;
        this.lastLeapTime = 0;
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

        graphics.clear().fillStyle(0x333333).fillEllipse(100, 110, 200, 150).fillCircle(100, 50, 60);
        graphics.fillTriangle(60, 20, 80, -10, 100, 20).fillTriangle(100, 20, 120, -10, 140, 20);
        graphics.fillStyle(0xfff000).fillCircle(80, 45, 8).fillCircle(120, 45, 8).generateTexture('boss_cat_final', 200, 200);

        graphics.clear().fillGradientStyle(0x87ceeb, 0x87ceeb, 0x4682b4, 0x4682b4, 1).fillRect(0, 0, 1280, 720).generateTexture('bg_sky', 1280, 720);
        graphics.clear().fillStyle(0x4b5d67).fillTriangle(200, 400, 600, 100, 1000, 400).generateTexture('bg_mountains', 1280, 400);
    }

    create() {
        localStorage.setItem('slopeScramble_checkpoint', 'BossScene');
        this.add.tileSprite(0, 0, 1280, 720, 'bg_sky').setOrigin(0).setScrollFactor(0).setTint(0x444444);
        this.add.tileSprite(0, 720, 1280, 400, 'bg_mountains').setOrigin(0, 1).setScrollFactor(0).setTint(0x444444);
        
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(640, 700, 'ground').setScale(40, 2).refreshBody();
        this.platforms.create(200, 500, 'ground').setScale(6, 1).refreshBody();
        this.platforms.create(1080, 500, 'ground').setScale(6, 1).refreshBody();

        this.nellie = new Nellie(this, 100, 600);
        this.leo = new Leo(this, 200, 600);
        this.lasers = this.physics.add.group();

        this.boss = this.physics.add.sprite(640, -300, 'boss_cat_final').setScale(2.5);
        this.boss.setCollideWorldBounds(true);
        if (this.boss.body) {
            (this.boss.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        }

        this.bossHealthBar = this.add.graphics();
        this.nellieHealthBar = this.add.graphics();
        this.leoHealthBar = this.add.graphics();
        this.drawUI();

        this.physics.add.collider([this.nellie, this.leo], this.platforms);
        this.physics.add.collider([this.nellie, this.leo], this.boss, (dog, b) => {
            const d = dog as Nellie | Leo;
            const bossSprite = b as Phaser.Physics.Arcade.Sprite;
            if (d.y < bossSprite.y - 100) {
                this.hitBoss(d);
                d.setVelocityY(-700);
            } else {
                this.hitDog(d);
            }
        });

        this.physics.add.overlap(this.lasers, [this.nellie, this.leo], (dog, laser) => {
            this.hitDog(dog as Nellie | Leo, laser as Phaser.Physics.Arcade.Sprite);
        });

        this.tweens.add({
            targets: this.boss,
            y: 350,
            duration: 2000,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                this.isBattleActive = true;
                this.startBossAI();
            }
        });

        this.activeDog = this.nellie;
        this.nellie.setActiveDog(true);
        this.leo.setActiveDog(false);
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.input.keyboard!.on('keydown-SPACE', () => this.swapDogs());
    }

    private drawUI() {
        this.bossHealthBar.clear();
        this.bossHealthBar.fillStyle(0x333333).fillRect(340, 20, 600, 30);
        this.bossHealthBar.fillStyle(0xff0000).fillRect(340, 20, 6 * this.bossHealth, 30);
        
        this.nellieHealthBar.clear();
        this.nellieHealthBar.fillStyle(0x333333).fillRect(50, 650, 200, 20);
        this.nellieHealthBar.fillStyle(0x0000ff).fillRect(50, 650, 2 * this.nellieHealth, 20);
        
        this.leoHealthBar.clear();
        this.leoHealthBar.fillStyle(0x333333).fillRect(50, 680, 200, 20);
        this.leoHealthBar.fillStyle(0xffa500).fillRect(50, 680, 2 * this.leoHealth, 20);
    }

    private startBossAI() {
        this.tweens.add({
            targets: this.boss,
            x: { from: 250, to: 1030 },
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    update(time: number) {
        if (!this.isBattleActive) return;
        if (this.activeDog) this.activeDog.update(this.cursors);

        // --- Follow Logic for Boss Scene ---
        const inactiveDog = (this.activeDog === this.nellie) ? this.leo : this.nellie;
        if (this.followMode) {
            const distX = Math.abs(this.activeDog.x - inactiveDog.x);
            const direction = this.activeDog.x > inactiveDog.x ? 1 : -1;
            if (distX > 100) {
                inactiveDog.setVelocityX(direction * (distX > 400 ? 250 : 120));
                inactiveDog.setFlipX(direction < 0);
                if (inactiveDog.body?.touching.down && (inactiveDog.body.blocked.left || inactiveDog.body.blocked.right)) {
                    inactiveDog.setVelocityY(-750);
                }
            } else {
                inactiveDog.setVelocityX(0);
            }
        } else {
            inactiveDog.setVelocityX(0);
        }

        if (time > this.lastLaserTime + 2500) {
            this.fireTripleLaser();
            this.lastLaserTime = time;
        }

        if (time > this.lastLeapTime + 4000) {
            if (this.activeDog.y < 450) {
                this.bossLeap();
                this.lastLeapTime = time;
            }
        }
    }

    private fireTripleLaser() {
        const angles = [-0.3, 0, 0.3];
        angles.forEach(angle => {
            const laser = this.add.rectangle(this.boss.x, this.boss.y, 15, 15, 0xff0000);
            this.lasers.add(laser);
            this.physics.add.existing(laser);
            this.physics.moveToObject(laser, this.activeDog, 400);
            if (laser.body) {
                const vel = (laser.body as Phaser.Physics.Arcade.Body).velocity;
                const rotatedVel = new Phaser.Math.Vector2(vel.x, vel.y).rotate(angle);
                vel.set(rotatedVel.x, rotatedVel.y);
            }
        });
    }

    private bossLeap() {
        this.tweens.add({
            targets: this.boss,
            y: this.activeDog.y,
            duration: 800,
            yoyo: true,
            ease: 'Quad.easeInOut',
            onStart: () => this.boss.setTint(0xff8888),
            onComplete: () => this.boss.clearTint()
        });
    }

    private hitDog(dog: Nellie | Leo, laser?: Phaser.Physics.Arcade.Sprite) {
        if (laser) laser.destroy();
        this.cameras.main.shake(100, 0.01);
        if (dog === this.nellie) this.nellieHealth -= 5;
        else this.leoHealth -= 5;
        this.drawUI();

        if (this.nellieHealth <= 0 || this.leoHealth <= 0) {
            this.isBattleActive = false;
            this.add.text(640, 360, 'THE CAT HAS WON...\nCLICK TO RETRY', { fontSize: '48px', align: 'center' }).setOrigin(0.5);
            this.input.once('pointerdown', () => this.scene.restart({ followMode: this.followMode }));
        }
    }

    private hitBoss(dog: Nellie | Leo) {
        if (this.bossInvincible) return;
        const damage = (dog instanceof Nellie) ? 10 : 5;
        this.bossHealth -= damage;
        this.bossInvincible = true;
        this.drawUI();
        this.cameras.main.flash(100, 255, 0, 0);

        this.tweens.add({
            targets: this.boss,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.bossInvincible = false;
                this.boss.setAlpha(1);
            }
        });

        if (this.bossHealth <= 0) {
            this.isBattleActive = false;
            localStorage.removeItem('slopeScramble_checkpoint');
            this.add.text(640, 360, 'BOSS DEFEATED!', { fontSize: '84px', color: '#00ff00' }).setOrigin(0.5);
            this.time.delayedCall(3000, () => this.scene.start('StartScene'));
        }
    }

    private swapDogs() {
        this.activeDog.setActiveDog(false);
        this.activeDog = (this.activeDog === this.nellie) ? this.leo : this.nellie;
        this.activeDog.setActiveDog(true);
    }
}
