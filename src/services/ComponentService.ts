import Phaser from "phaser";
import short from "short-uuid"

export type Constructor<T extends {} = {}> = new (...args:any[]) => T

export interface IComponent {
    init(go:Phaser.GameObjects.GameObject)
    awake?:() => void
    start?: () => void
    update?: (dt:number) => void
    destroy?: () => void 
}

export default class ComponentService {
    
    private componentsByGameObject = new Map<String, IComponent[]>()
    private queuedForStart: IComponent[] = []
    
    addComponent(go:Phaser.GameObjects.GameObject, component:IComponent){

        // give our game object a unique name
        if (!go.name){
            go.name = short.generate()
        }

        // make sure that our map has an entry for the game object
        if (!this.componentsByGameObject.has(go.name)){
            this.componentsByGameObject.set(go.name, [])
        }

        // add new component to this game object
        const list = this.componentsByGameObject.get(go.name) as IComponent[]
        list.push(component)
        
        // call the life cycle hooks
        component.init(go)

        if (component.awake){
            component.awake()
        }

        if (component.start){
            this.queuedForStart.push(component)
        }
    }

    findComponent<ComponentType>(go:Phaser.GameObjects.GameObject, componentType:Constructor<ComponentType>){
        const components = this.componentsByGameObject.get(go.name)
        if (!components){
            return null
        }

        return components.find(component => components instanceof componentType)
    }

    destroy(){
        const entries =  this.componentsByGameObject.entries()
        for (const [, components] of entries){
            components.forEach((component:IComponent) => {
                if (component.destroy){
                    component.destroy()
                }
            });
        }
    }

    update(dt:number){

        // process queued for start
        while (this.queuedForStart.length > 0) {
            const component = this.queuedForStart.shift()
            if (component?.start){
                component.start()
            }
        }

        // update each component
        const entries =  this.componentsByGameObject.entries()
        for (const [, components] of entries){
            components.forEach((component:IComponent) => {
                if (component.update){
                    component.update(dt)
                }
            });
        }
    }
}