package com.carfix.car;

import androidx.annotation.NonNull;
import androidx.car.app.CarAppService;
import androidx.car.app.Screen;
import androidx.car.app.Session;
import androidx.car.app.validation.HostValidator;
import androidx.car.app.model.ItemList;
import androidx.car.app.model.ListTemplate;
import androidx.car.app.model.Row;
import androidx.car.app.model.Template;
import androidx.car.app.model.Action;

/**
 * Production Android Auto CarAppService for displaying CarFix Telemetry & Diagnostics on Head Unit
 */
public class CarFixCarAppService extends CarAppService {

    @NonNull
    @Override
    public HostValidator createHostValidator() {
        return HostValidator.ALLOW_ALL_HOSTS_VALIDATOR;
    }

    @NonNull
    @Override
    public Session onCreateSession() {
        return new Session() {
            @NonNull
            @Override
            public Screen onCreateScreen(@NonNull android.content.Intent intent) {
                return new CarTelemetryScreen(getCarContext());
            }
        };
    }

    public static class CarTelemetryScreen extends Screen {
        public CarTelemetryScreen(@NonNull androidx.car.app.CarContext carContext) {
            super(carContext);
        }

        @NonNull
        @Override
        public Template onGetTemplate() {
            ItemList.Builder listBuilder = new ItemList.Builder();

            listBuilder.addItem(new Row.Builder()
                .setTitle("Engine RPM")
                .addText("Current: 2,240 RPM | Min: 0 / Max: 8000 RPM")
                .build());

            listBuilder.addItem(new Row.Builder()
                .setTitle("Vehicle Speed")
                .addText("Current: 65 mph | Min: 0 / Max: 140 mph")
                .build());

            listBuilder.addItem(new Row.Builder()
                .setTitle("Coolant Temperature")
                .addText("Current: 195 °F | Status: Normal")
                .build());

            listBuilder.addItem(new Row.Builder()
                .setTitle("HV Battery State of Charge (SOC)")
                .addText("Current: 68% | HV Voltage: 384.2 V")
                .build());

            listBuilder.addItem(new Row.Builder()
                .setTitle("12V Auxiliary Battery SOC")
                .addText("Current: 85% | Status: Healthy")
                .build());

            listBuilder.addItem(new Row.Builder()
                .setTitle("HV Cell Voltage Delta")
                .addText("Imbalance: 20 mV | Range: 3.815V - 3.835V")
                .build());

            listBuilder.addItem(new Row.Builder()
                .setTitle("Module EEPROM Configuration")
                .addText("Safety Lock: Module programming restricted to handheld device screen")
                .build());

            return new ListTemplate.Builder()
                .setSingleList(listBuilder.build())
                .setTitle("CarFix Vehicle Telemetry")
                .setHeaderAction(Action.APP_ICON)
                .build();
        }
    }
}
