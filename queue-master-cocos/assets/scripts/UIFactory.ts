import {
    Color,
    EventTouch,
    Graphics,
    Label,
    Node,
    UITransform,
    Vec3,
} from 'cc';
import { PersonData } from './GameTypes';

export const PALETTE = {
    ink: new Color(36, 33, 29, 255),
    paper: new Color(255, 250, 240, 255),
    yellow: new Color(255, 201, 40, 255),
    orange: new Color(255, 122, 54, 255),
    blue: new Color(89, 119, 217, 255),
    mint: new Color(117, 212, 189, 255),
    red: new Color(239, 91, 85, 255),
    cream: new Color(248, 237, 209, 255),
    white: new Color(255, 255, 255, 255),
    muted: new Color(116, 109, 98, 255),
    dark: new Color(39, 36, 31, 255),
};

function cloneColor(color: Color): Color {
    return new Color(color.r, color.g, color.b, color.a);
}

export class UIFactory {
    public panel(
        parent: Node,
        name: string,
        width: number,
        height: number,
        color: Color,
        x = 0,
        y = 0,
        radius = 18,
        border = 0,
    ): Node {
        const node = new Node(name);
        parent.addChild(node);
        node.setPosition(x, y);
        node.addComponent(UITransform).setContentSize(width, height);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = cloneColor(color);
        graphics.roundRect(-width / 2, -height / 2, width, height, radius);
        graphics.fill();
        if (border > 0) {
            graphics.strokeColor = cloneColor(PALETTE.ink);
            graphics.lineWidth = border;
            graphics.roundRect(-width / 2, -height / 2, width, height, radius);
            graphics.stroke();
        }
        return node;
    }

    public text(
        parent: Node,
        content: string,
        fontSize: number,
        color = PALETTE.ink,
        x = 0,
        y = 0,
        width = 620,
        height = 60,
        bold = false,
    ): Label {
        const node = new Node(`Label-${content.slice(0, 8)}`);
        parent.addChild(node);
        node.setPosition(x, y);
        node.addComponent(UITransform).setContentSize(width, height);
        const label = node.addComponent(Label);
        label.string = content;
        label.fontSize = fontSize;
        label.lineHeight = Math.round(fontSize * 1.25);
        label.color = cloneColor(color);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        if (bold) {
            label.isBold = true;
        }
        return label;
    }

    public button(
        parent: Node,
        title: string,
        width: number,
        height: number,
        color: Color,
        x: number,
        y: number,
        onTap: () => void,
        subtitle = '',
    ): Node {
        const node = this.panel(parent, `Button-${title}`, width, height, color, x, y, 16, 4);
        this.text(node, title, subtitle ? 29 : 26, PALETTE.ink, 0, subtitle ? 13 : 0, width - 28, 42, true);
        if (subtitle) {
            this.text(node, subtitle, 15, PALETTE.muted, 0, -22, width - 24, 28);
        }
        node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            onTap();
        });
        return node;
    }

    public progress(
        parent: Node,
        width: number,
        height: number,
        ratio: number,
        x: number,
        y: number,
        color = PALETTE.mint,
    ): Node {
        const background = this.panel(parent, 'Progress', width, height, PALETTE.white, x, y, height / 2, 3);
        const safeRatio = Math.max(0, Math.min(1, ratio));
        if (safeRatio > 0) {
            const fillWidth = Math.max(height, (width - 6) * safeRatio);
            this.panel(
                background,
                'ProgressFill',
                fillWidth,
                height - 6,
                color,
                -(width - 6 - fillWidth) / 2,
                0,
                (height - 6) / 2,
            );
        }
        return background;
    }

    public person(parent: Node, person: PersonData, x = 0, y = 0, scale = 1): Node {
        const root = new Node(`Person-${person.name}`);
        parent.addChild(root);
        root.setPosition(x, y);
        root.setScale(scale, scale);
        root.addComponent(UITransform).setContentSize(230, 330);

        this.ellipse(root, 140, 24, PALETTE.ink, 0, -151);
        this.rect(root, 34, 110, new Color(65, 72, 103), -34, -98, 6, 4);
        this.rect(root, 34, 110, new Color(65, 72, 103), 34, -98, 6, 4);
        if (person.hasBag) {
            this.rect(root, 75, 90, new Color(185, 133, 86), 70, -28, 12, 4);
            this.text(root, '▦', 32, PALETTE.ink, 70, -28, 60, 60);
        }

        const shirtColors: Record<PersonData['clothesColor'], Color> = {
            red: new Color(236, 100, 92),
            blue: new Color(102, 132, 220),
            black: new Color(77, 77, 85),
            cream: new Color(242, 217, 167),
            green: new Color(128, 199, 157),
        };
        this.rect(root, 120, 125, shirtColors[person.clothesColor], 0, -22, 28, 4);
        this.rect(root, 30, 105, new Color(255, 213, 173), -73, -22, 14, 4);
        this.rect(root, 30, 105, new Color(255, 213, 173), 73, -22, 14, 4);

        if (person.hasLaptop) {
            this.rect(root, 92, 66, new Color(185, 192, 200), 0, -38, 6, 4);
            this.text(root, '⌁', 36, PALETTE.white, 0, -38, 70, 50, true);
        }
        if (person.hasCoffee) {
            this.text(root, '☕', 42, PALETTE.ink, -90, -78, 65, 60);
        }
        if (person.checkingPhone) {
            this.rect(root, 34, 55, new Color(35, 37, 46), 91, -65, 5, 3);
            this.text(root, '▣', 22, PALETTE.mint, 91, -65, 30, 45);
        }

        this.ellipse(root, 100, 100, new Color(255, 213, 173), 0, 92, 4);
        this.ellipse(root, 104, 45, new Color(66, 54, 45), 0, 128, 4);
        if (person.hasHat) {
            this.rect(root, 92, 35, PALETTE.yellow, 0, 151, 15, 4);
            this.rect(root, 45, 8, PALETTE.ink, 47, 136, 2);
        }
        if (person.hasGlasses) {
            this.rect(root, 34, 24, new Color(255, 255, 255, 70), -23, 91, 7, 4);
            this.rect(root, 34, 24, new Color(255, 255, 255, 70), 23, 91, 7, 4);
            this.rect(root, 12, 4, PALETTE.ink, 0, 91, 0);
        } else {
            this.ellipse(root, 7, 7, PALETTE.ink, -20, 94);
            this.ellipse(root, 7, 7, PALETTE.ink, 20, 94);
        }
        this.rect(root, 24, 4, PALETTE.ink, 0, person.tired ? 68 : 72, 2);
        if (person.sneaky) {
            this.text(root, '›', 29, PALETTE.ink, 40, 76, 25, 35, true);
        }
        this.panel(root, 'NameTag', 92, 32, PALETTE.white, 0, -172, 7, 3);
        this.text(root, person.name, 17, PALETTE.ink, 0, -172, 80, 25, true);
        return root;
    }

    public clear(node: Node): void {
        [...node.children].forEach((child) => child.destroy());
    }

    private rect(
        parent: Node,
        width: number,
        height: number,
        color: Color,
        x: number,
        y: number,
        radius = 0,
        border = 0,
    ): Node {
        return this.panel(parent, 'Shape', width, height, color, x, y, radius, border);
    }

    private ellipse(
        parent: Node,
        width: number,
        height: number,
        color: Color,
        x: number,
        y: number,
        border = 0,
    ): Node {
        const node = new Node('Ellipse');
        parent.addChild(node);
        node.setPosition(x, y);
        node.addComponent(UITransform).setContentSize(width, height);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = cloneColor(color);
        graphics.ellipse(0, 0, width / 2, height / 2);
        graphics.fill();
        if (border > 0) {
            graphics.strokeColor = cloneColor(PALETTE.ink);
            graphics.lineWidth = border;
            graphics.ellipse(0, 0, width / 2, height / 2);
            graphics.stroke();
        }
        return node;
    }
}
