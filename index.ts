import { $query, Record, StableBTreeMap, Result, nat64, ic } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Vehicle = Record<{
    id: string;
    model: string;
    version: string;
    mileage: nat64;
    depreciation: nat64;
    createdAt: nat64;
}>

type MileagePayload = Record<{
    miles: nat64;
}>

type DepreciationPayload = Record<{
    depreciation: nat64;
}>

const vehicleDataStorage = new StableBTreeMap<string, Vehicle>(0, 44, 1024);

$query;
export function getVehicle(id: string): Result<Vehicle, string> {
    return match(vehicleDataStorage.get(id), {
        Some: (vehicle) => Result.Ok<Vehicle, string>(vehicle),
        None: () => Result.Err<Vehicle, string>(`A vehicle with id=${id} not found`)
    });
}

export function addMileage(id: string, payload: MileagePayload): Result<Vehicle, string> {
    const vehicle = vehicleDataStorage.get(id);
    if (!vehicle) {
        return Result.Err<Vehicle, string>(`A vehicle with id=${id} not found`);
    }

    const updatedVehicle: Vehicle = {
        ...vehicle,
        mileage: vehicle.mileage + payload.miles,
        createdAt: ic.time()
    };
    vehicleDataStorage.insert(vehicle.id, updatedVehicle);

    return Result.Ok<Vehicle, string>(updatedVehicle);
}

export function calculateDepreciation(id: string, payload: DepreciationPayload): Result<Vehicle, string> {
    const vehicle = vehicleDataStorage.get(id);
    if (!vehicle) {
        return Result.Err<Vehicle, string>(`A vehicle with id=${id} not found`);
    }

    const adjustedDepreciation = vehicle.depreciation + payload.depreciation;
    const updatedVehicle: Vehicle = {
        ...vehicle,
        depreciation: adjustedDepreciation,
        createdAt: ic.time()
    };
    vehicleDataStorage.insert(vehicle.id, updatedVehicle);

    return Result.Ok<Vehicle, string>(updatedVehicle);
}

// Retrieve vehicles that match the given criteria
export function filterVehicles(criteria: Partial<Vehicle>): Vehicle[] {
    const vehicles: Vehicle[] = [];
    for (const [, vehicle] of vehicleDataStorage.entries()) {
        if (isVehicleMatchingCriteria(vehicle, criteria)) {
            vehicles.push(vehicle);
        }
    }
    return vehicles;
}

// Helper function to check if a vehicle matches the given criteria
function isVehicleMatchingCriteria(vehicle: Vehicle, criteria: Partial<Vehicle>): boolean {
    for (const key in criteria) {
        if (vehicle[key] !== criteria[key]) {
            return false;
        }
    }
    return true;
}

// Sort vehicles based on the given property
export function sortVehicles(property: keyof Vehicle): Vehicle[] {
    const vehicles: Vehicle[] = [];
    for (const [, vehicle] of vehicleDataStorage.entries()) {
        vehicles.push(vehicle);
    }
    return vehicles.sort((a, b) => a[property] - b[property]);
}
