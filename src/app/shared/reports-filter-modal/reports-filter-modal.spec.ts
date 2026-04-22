import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsFilterModal } from './reports-filter-modal';

describe('ReportsFilterModal', () => {
  let component: ReportsFilterModal;
  let fixture: ComponentFixture<ReportsFilterModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportsFilterModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsFilterModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
