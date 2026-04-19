/**
 * All of the lifecycle shite
 */
export interface Lifecycle {
    /**
     * called when components are started
     * 
     * @hideinherited
     */
	OnStart?: () => void;

    /**
     * called when components are made
     * 
     * @hideinherited 
     */
    OnInit?: () => void;

    /**
     * called on every frame after the physics
     * 
     * @hideinherited
     */
    OnTick?: (dt: number) => void;

    /**
     * this is like clientsided only i think
     * 
     * @client
     */
    OnRender?: (dt: number) => void;
}