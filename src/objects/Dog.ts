import Phaser from 'phaser';

export class Dog extends Phaser.Physics.Arcade.Sprite {
    protected moveSpeed: number = 0;
    protected jumpStrength: number = 0;
    protected isActiveDog: boolean = false;
    
    private coyoteTimer: number = 0;
    private jumpBufferTimer: number = 0;
    private isJumping: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setOrigin(0.5, 1);
    }

    public setActiveDog(active: boolean) {
        this.isActiveDog = active;
        if (active) {
            this.setAlpha(1);
        } else {
            this.setAlpha(0.6);
            this.setVelocityX(0);
        }
    }

    public update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        if (!this.isActiveDog) return;
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;
        
        const time = this.scene.time.now;

        // --- Coyote Time & Buffering ---
        if (body.touching.down) {
            this.coyoteTimer = time + 100;
        }
        if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
            this.jumpBufferTimer = time + 150;
        }

        // --- Horizontal Movement ---
        const accel = body.touching.down ? 1 : 0.8;
        if (cursors.left.isDown) {
            this.setVelocityX(-this.moveSpeed * accel);
            this.setFlipX(true);
            this.animateWobble();
        } else if (cursors.right.isDown) {
            this.setVelocityX(this.moveSpeed * accel);
            this.setFlipX(false);
            this.animateWobble();
        } else {
            this.setVelocityX(body.velocity.x * 0.9);
            this.setScale(1);
        }

        // --- Jump Logic ---
        const canJump = this.coyoteTimer > time;
        const wantsToJump = this.jumpBufferTimer > time;

        if (canJump && wantsToJump && !this.isJumping) {
            this.setVelocityY(this.jumpStrength);
            this.isJumping = true;
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            
            this.scene.tweens.add({
                targets: this,
                scaleX: 0.8, scaleY: 1.2,
                duration: 100, yoyo: true
            });
        }

        if (this.isJumping && !cursors.up.isDown && body.velocity.y < 0) {
            this.setVelocityY(body.velocity.y * 0.5);
        }

        if (body.touching.down && body.velocity.y >= 0) {
            if (this.isJumping) {
                this.isJumping = false;
                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1.3, scaleY: 0.7,
                    duration: 100, yoyo: true
                });
            }
        }
    }

    private animateWobble() {
        this.setRotation(Math.sin(this.scene.time.now * 0.02) * 0.1);
    }
}

export class Nellie extends Dog {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'nellie');
        this.setDisplaySize(64, 64);
        if (this.body) {
            this.body.setSize(64, 64);
            this.body.mass = 2.0;
        }
        this.moveSpeed = 200;
        this.jumpStrength = -800; 
    }
}

export class Leo extends Dog {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'leo');
        this.setDisplaySize(32, 32);
        if (this.body) {
            this.body.setSize(32, 32);
            this.body.mass = 0.5;
        }
        this.moveSpeed = 300;
        this.jumpStrength = -850;
    }
}
