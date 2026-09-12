"""initial civicai schema

Revision ID: 001_initial
Revises: 
Create Date: 2026-09-06 23:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Authorities table
    op.create_table(
        'authorities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('department', sa.String(length=150), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('area', sa.String(length=100), nullable=False, server_default='Citywide'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_authorities_id', 'authorities', ['id'], unique=False)
    op.create_index('ix_authorities_category', 'authorities', ['category'], unique=False)

    # Complaints table
    op.create_table(
        'complaints',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('complaint_id', sa.String(length=50), nullable=False),
        sa.Column('issue_type', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('severity', sa.String(length=50), nullable=False),
        sa.Column('safety_risk', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('ai_description', sa.Text(), nullable=True),
        sa.Column('complaint_title', sa.String(length=255), nullable=False),
        sa.Column('complaint_description', sa.Text(), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('location_text', sa.String(length=255), nullable=True),
        sa.Column('authority_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='SUBMITTED', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['authority_id'], ['authorities.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_complaints_id', 'complaints', ['id'], unique=False)
    op.create_index('ix_complaints_complaint_id', 'complaints', ['complaint_id'], unique=True)
    op.create_index('ix_complaints_category', 'complaints', ['category'], unique=False)
    op.create_index('ix_complaints_severity', 'complaints', ['severity'], unique=False)
    op.create_index('ix_complaints_status', 'complaints', ['status'], unique=False)
    op.create_index('ix_complaints_authority_id', 'complaints', ['authority_id'], unique=False)
    op.create_index('ix_complaints_created_at', 'complaints', ['created_at'], unique=False)

    # Status History table
    op.create_table(
        'status_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('complaint_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_status_history_id', 'status_history', ['id'], unique=False)
    op.create_index('ix_status_history_complaint_id', 'status_history', ['complaint_id'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_status_history_complaint_id', table_name='status_history')
    op.drop_index('ix_status_history_id', table_name='status_history')
    op.drop_table('status_history')

    op.drop_index('ix_complaints_created_at', table_name='complaints')
    op.drop_index('ix_complaints_authority_id', table_name='complaints')
    op.drop_index('ix_complaints_status', table_name='complaints')
    op.drop_index('ix_complaints_severity', table_name='complaints')
    op.drop_index('ix_complaints_category', table_name='complaints')
    op.drop_index('ix_complaints_complaint_id', table_name='complaints')
    op.drop_index('ix_complaints_id', table_name='complaints')
    op.drop_table('complaints')

    op.drop_index('ix_authorities_category', table_name='authorities')
    op.drop_index('ix_authorities_id', table_name='authorities')
    op.drop_table('authorities')
