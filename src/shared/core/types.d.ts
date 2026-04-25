/**
 * All of the lifecycle shite
 */
export interface I_Lifecycle {
	/**
	 * called when components are started
	 * parallel when compared to oninit, doesn't yield
	 *
	 * @hideinherited
	 */
	OnStart?(): void;

	/**
	 * called when components are made
	 * THIS DOES YIELD LOADING OF OTHER COMPONENTS IF YOU YIELD HERE
	 *
	 * @hideinherited
	 */
	OnInit?(): void;

	/**
	 * called on every frame after the physics
	 *
	 * @hideinherited
	 */
	OnTick?(dt: number): void;

	/**
	 * this is like clientsided only i think
	 *
	 * @client
	 */
	OnRender?(dt: number): void;
}
