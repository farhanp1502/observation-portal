import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityFilterPopupComponent } from './entity-filter-popup.component';

describe('EntityFilterPopupComponent', () => {
  let component: EntityFilterPopupComponent;
  let fixture: ComponentFixture<EntityFilterPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntityFilterPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityFilterPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
