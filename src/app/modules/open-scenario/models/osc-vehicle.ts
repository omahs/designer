/*
 * Copyright Truesense AI Solutions Pvt Ltd, All Rights Reserved.
 */

import { OscBoundingBox } from './osc-bounding-box';
import { OscVehicleCategory } from './osc-enums';
import { IScenarioObject } from './osc-interfaces';
import { OscParameterDeclaration } from './osc-parameter-declaration';
import { OscProperties } from './osc-properties';

export class OscVehicle extends IScenarioObject {
	private m_Name: string;
	private m_Category: OscVehicleCategory;
	private m_ParameterDeclarations: OscParameterDeclaration[];
	private m_BoundingBox: OscBoundingBox;
	private m_Properties: OscProperties;

	private m_FrontAxle: OscAxle;
	private m_RearAxle: OscAxle;
	private m_AdditionalAxles: OscAxle[];

}

export class OscPerformance {

	private maxSpeed: number;
	private maxDeceleration: number;
	private mass: number;

}

export class OscAxle {

	private maxSteering: number;
	private wheelDiameter: number;
	private trackWidth: number;
	private positionX: number;
	private positionZ: number;

}